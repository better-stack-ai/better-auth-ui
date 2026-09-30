import { authQueryKeys } from "@better-auth-ui/core"
import type { AgentAuthAdapter } from "@better-auth-ui/core/plugins/agent-auth"
import type { BillingAdapter } from "@better-auth-ui/core/plugins/billing"
import { useUnlinkAccount } from "@better-auth-ui/react"
import { QueryClient } from "@tanstack/react-query"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createAuthClient } from "better-auth/react"
import type { ReactNode } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Admin } from "../../components/auth/admin/admin"
import { AgentApproval } from "../../components/auth/agent-auth/agent-approval"
import { AuthProvider } from "../../components/auth/auth-provider"
import { UserBillingSettings } from "../../components/auth/billing/billing-settings"
import { DeviceAuthorization } from "../../components/auth/device-authorization/device-authorization"
import { OAuthConsent } from "../../components/auth/oauth-provider/oauth-consent"
import { SignIn } from "../../components/auth/sign-in"
import { SignOut } from "../../components/auth/sign-out"
import { adminPlugin } from "../auth/admin-plugin"
import { agentAuthPlugin } from "../auth/agent-auth-plugin"
import type { AuthPlugin } from "../auth/auth-plugin"
import { billingPlugin } from "../auth/billing-plugin"
import { deviceAuthorizationPlugin } from "../auth/device-authorization-plugin"
import { oauthProviderPlugin } from "../auth/oauth-provider-plugin"

const user = {
    id: "u1",
    name: "Ada",
    email: "ada@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
}
const session = {
    user,
    session: {
        id: "s1",
        userId: "u1",
        token: "token",
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000)
    }
}

function fixture(routes: Record<string, unknown>, loggedIn = true) {
    const requests: { path: string; body: unknown }[] = []
    const authClient = createAuthClient({
        baseURL: "http://localhost:3000/api/auth",
        fetchOptions: {
            customFetchImpl: async (input, init) => {
                const path = new URL(String(input)).pathname.replace(
                    "/api/auth",
                    ""
                )
                const body = init?.body
                    ? JSON.parse(String(init.body))
                    : undefined
                requests.push({ path, body })
                if (!(path in routes))
                    throw new Error(`Unexpected native auth request: ${path}`)
                return new Response(JSON.stringify(routes[path]), {
                    headers: { "content-type": "application/json" }
                })
            }
        }
    })
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { staleTime: Infinity, retry: false },
            mutations: { retry: false }
        }
    })
    queryClient.setQueryData(authQueryKeys.session, loggedIn ? session : null)
    const navigate = vi.fn()
    function wrap(children: ReactNode, plugins: AuthPlugin[] = []) {
        return (
            <AuthProvider
                authClient={authClient}
                queryClient={queryClient}
                navigate={navigate}
                plugins={plugins}
                Link={({ href, ...props }) => <a href={href} {...props} />}
            >
                {children}
            </AuthProvider>
        )
    }
    return { authClient, queryClient, requests, navigate, wrap }
}

afterEach(() => window.history.replaceState({}, "", "/"))

describe("packaged upstream behavior with native Better Auth requests", () => {
    it("signs in with credentials through the native endpoint", async () => {
        const f = fixture(
            {
                "/sign-in/email": { token: "token", user },
                "/get-session": session
            },
            false
        )
        render(f.wrap(<SignIn />))
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: user.email }
        })
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" }
        })
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }))
        await waitFor(() =>
            expect(f.requests).toContainEqual(
                expect.objectContaining({
                    path: "/sign-in/email",
                    body: expect.objectContaining({
                        email: user.email,
                        password: "password123"
                    })
                })
            )
        )
        await waitFor(() => expect(f.navigate).toHaveBeenCalled())
    })

    it("signs out and invalidates the native session", async () => {
        const f = fixture({
            "/sign-out": { success: true },
            "/get-session": null
        })
        render(f.wrap(<SignOut />))
        await waitFor(() =>
            expect(
                f.requests.some((request) => request.path === "/sign-out")
            ).toBe(true)
        )
        await waitFor(() => expect(f.navigate).toHaveBeenCalled())
    })

    it("uses the native account record ID when unlinking an account", async () => {
        const f = fixture({ "/unlink-account": { status: true } })
        function Unlink() {
            const mutation = useUnlinkAccount(f.authClient)
            return (
                <button
                    type="button"
                    onClick={() =>
                        mutation.mutate({
                            accountId: "account-record-123"
                        })
                    }
                >
                    Unlink
                </button>
            )
        }
        render(f.wrap(<Unlink />))
        fireEvent.click(screen.getByText("Unlink"))
        await waitFor(() =>
            expect(f.requests).toContainEqual({
                path: "/unlink-account",
                body: { accountId: "account-record-123" }
            })
        )
    })

    it("fails closed when native admin permissions deny access", async () => {
        const f = fixture({ "/admin/has-permission": { success: false } })
        render(f.wrap(<Admin view="users" />, [adminPlugin()]))
        await waitFor(() =>
            expect(
                f.requests.some(
                    (request) => request.path === "/admin/has-permission"
                )
            ).toBe(true)
        )
        expect(
            f.requests.some((request) => request.path === "/admin/list-users")
        ).toBe(false)
        expect(
            screen.queryByRole("button", { name: /create user/i })
        ).toBeNull()
    })

    it("renders provider billing plans and passes user scope to checkout", async () => {
        const f = fixture({})
        const adapter: BillingAdapter = {
            id: "test",
            supports: { cancel: false, restore: false, seats: false },
            listPlans: vi.fn(async () => [
                {
                    id: "pro",
                    name: "Pro",
                    prices: [
                        {
                            id: "monthly",
                            amount: 1200,
                            currency: "USD",
                            interval: "month" as const
                        }
                    ]
                }
            ]),
            getState: vi.fn(async () => ({ usage: [] })),
            checkout: vi.fn(async () => ({})),
            openPortal: vi.fn(async () => ({})),
            cancel: vi.fn(async () => ({})),
            restore: vi.fn(async () => ({})),
            updateSeats: vi.fn(async () => ({}))
        }
        render(f.wrap(<UserBillingSettings />, [billingPlugin({ adapter })]))
        expect(await screen.findByText("Pro")).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: /choose plan/i }))
        await waitFor(() =>
            expect(adapter.checkout).toHaveBeenCalledWith(
                { type: "user", userId: "u1" },
                { planId: "pro", priceId: "monthly" }
            )
        )
    })

    it("verifies and approves a device using native device endpoints", async () => {
        window.history.replaceState({}, "", "/auth/device?user_code=ABCD1234")
        const f = fixture({
            "/device": { status: "pending" },
            "/device/approve": { success: true }
        })
        render(f.wrap(<DeviceAuthorization />, [deviceAuthorizationPlugin()]))
        fireEvent.click(
            await screen.findByRole("button", { name: /^approve/i })
        )
        await waitFor(() =>
            expect(f.requests).toContainEqual(
                expect.objectContaining({
                    path: "/device/approve",
                    body: expect.objectContaining({ userCode: "ABCD1234" })
                })
            )
        )
    })

    it("renders OAuth client consent and submits the requested scopes", async () => {
        window.history.replaceState(
            {},
            "",
            "/auth/oauth-consent?client_id=app1&scope=openid%20email&consent_code=consent1"
        )
        const f = fixture({
            "/oauth2/public-client": {
                client_id: "app1",
                client_name: "Example Client"
            },
            "/oauth2/consent": { redirect: false }
        })
        render(f.wrap(<OAuthConsent />, [oauthProviderPlugin()]))
        expect(await screen.findByText("Example Client")).toBeTruthy()
        fireEvent.click(
            screen.getByRole("button", { name: /allow|authorize/i })
        )
        await waitFor(() =>
            expect(
                f.requests.some((request) => request.path === "/oauth2/consent")
            ).toBe(true)
        )
    })

    it("passes selected agent capabilities to the application adapter", async () => {
        window.history.replaceState(
            {},
            "",
            "/auth/agent-approval?agent_id=agent1"
        )
        const f = fixture({})
        const adapter: AgentAuthAdapter = {
            getApproval: vi.fn(async () => ({
                id: "agent1",
                name: "Assistant",
                status: "pending",
                mode: "delegated" as const,
                hostId: "host",
                grants: [],
                createdAt: new Date(),
                requestedCapabilities: [
                    {
                        capability: "read:profile",
                        status: "pending" as const,
                        approvalStrength: "none" as const
                    }
                ]
            })),
            approve: vi.fn(async () => {}),
            deny: vi.fn(async () => {}),
            listAgents: vi.fn(async () => []),
            revoke: vi.fn(async () => {})
        }
        render(f.wrap(<AgentApproval />, [agentAuthPlugin({ adapter })]))
        expect(await screen.findByText("Assistant")).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Allow selected" }))
        await waitFor(() =>
            expect(adapter.approve).toHaveBeenCalledWith(
                expect.objectContaining({
                    agentId: "agent1",
                    capabilities: ["read:profile"]
                })
            )
        )
    })
})

it("hydrates agent approval URLs without changing the initial server markup", async () => {
    window.history.replaceState({}, "", "/auth/agent-approval?agent_id=agent1")
    const f = fixture({})
    const adapter: AgentAuthAdapter = {
        getApproval: () => new Promise(() => {}),
        approve: async () => {},
        deny: async () => {},
        listAgents: async () => [],
        revoke: async () => {}
    }
    const tree = f.wrap(<AgentApproval />, [agentAuthPlugin({ adapter })])
    const browserWindow = window
    let html: string
    vi.stubGlobal("window", undefined)
    try {
        html = renderToString(tree)
    } finally {
        vi.stubGlobal("window", browserWindow)
    }
    const container = document.createElement("div")
    container.innerHTML = html
    document.body.append(container)
    const errors: unknown[] = []
    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
        root = hydrateRoot(container, tree, {
            onRecoverableError: (error) => errors.push(error)
        })
    })
    act(() => root.unmount())
    container.remove()
    expect(errors).toEqual([])
})

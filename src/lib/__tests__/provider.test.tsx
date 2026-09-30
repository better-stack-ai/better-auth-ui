import { type AuthConfig, authQueryKeys } from "@better-auth-ui/core"
import { useAuth, useSession } from "@better-auth-ui/react"
import { createClientStack } from "@btst/stack/client"
import { StackProvider } from "@btst/stack/context"
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"
import { createAuthClient } from "better-auth/react"
import { useEffect } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { accountClientPlugin, authClientPlugin } from "../../client"
import { AuthProvider } from "../../components/auth/auth-provider"
import { organizationPlugin } from "../auth/organization-plugin"
import { useAuthNotifications } from "../notifications"
import { BetterAuthPluginProvider } from "../plugin-context-bridge"

function createStack(queryClient: QueryClient) {
    return createClientStack({
        queryClient,
        api: { baseURL: "https://app.test", basePath: "/api/data" },
        site: { baseURL: "https://app.test", basePath: "/p" },
        plugins: { auth: authClientPlugin(), account: accountClientPlugin() }
    })
}

const session = {
    user: {
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    session: {
        id: "session-1",
        userId: "user-1",
        token: "token",
        expiresAt: new Date(Date.now() + 100000),
        createdAt: new Date(),
        updatedAt: new Date()
    }
}

describe("BTST provider services", () => {
    it("works with only auth/account; forwards config, notifications and shared cache", () => {
        const queryClient = new QueryClient()
        queryClient.setQueryData(authQueryKeys.session, session)
        const stack = createStack(queryClient)
        const notify = { success: vi.fn(), error: vi.fn() }
        const navigate = vi.fn()
        const authClient = createAuthClient()
        let config!: AuthConfig
        function Capture() {
            config = useAuth()
            const notifications = useAuthNotifications()
            expect(useQueryClient()).toBe(queryClient)
            return (
                <button
                    type="button"
                    onClick={() => notifications.success("Saved")}
                >
                    Save
                </button>
            )
        }
        render(
            <StackProvider
                stack={stack}
                router={{ navigate }}
                notify={notify}
                i18n={{
                    translate: (key, value) =>
                        key === "auth.auth.signIn" ? "Log in" : value
                }}
                overrides={{
                    auth: {
                        authClient,
                        profile: { name: false },
                        viewPaths: { settings: { account: "settings" } }
                    }
                }}
            >
                <BetterAuthPluginProvider>
                    <Capture />
                </BetterAuthPluginProvider>
            </StackProvider>
        )
        expect(config.authClient).toBe(authClient)
        expect(config.basePaths).toEqual({
            auth: "/p/auth",
            settings: "/p/account",
            organization: "/p/organization",
            admin: "/p/admin"
        })
        expect(config.profile.name).toBe(false)
        expect(config.viewPaths.settings.account).toBe("settings")
        act(() => screen.getByText("Save").click())
        expect(notify.success).toHaveBeenCalledWith("Saved")
        act(() => config.navigate({ to: "/p/account/settings" }))
        expect(navigate).toHaveBeenCalledWith("/p/account/settings")
    })

    it("keeps configuration stable while native session data updates and invokes refresh once", async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { staleTime: Infinity } }
        })
        queryClient.setQueryData(authQueryKeys.session, null)
        const stack = createStack(queryClient)
        const changes = vi.fn()
        const configurations: AuthConfig[] = []
        const authClient = createAuthClient()
        function Capture() {
            const config = useAuth()
            const { data } = useSession(authClient)
            useEffect(() => {
                configurations.push(config)
            }, [config])
            return <div>{data?.user.name ?? "Anonymous"}</div>
        }
        render(
            <StackProvider
                stack={stack}
                overrides={{ auth: { authClient, onSessionChange: changes } }}
            >
                <BetterAuthPluginProvider>
                    <Capture />
                </BetterAuthPluginProvider>
            </StackProvider>
        )
        expect(screen.getByText("Anonymous")).toBeTruthy()
        await act(async () => {
            queryClient.setQueryData(authQueryKeys.session, session)
        })
        await waitFor(() => expect(screen.getByText("Ada")).toBeTruthy())
        expect(changes).toHaveBeenCalledTimes(1)
        expect(configurations).toHaveLength(1)
    })

    it("resolves organization slugs without mutating shared plugin configuration", () => {
        const queryClient = new QueryClient()
        const stack = createStack(queryClient)
        const organization = organizationPlugin({
            slugPrefix: "@",
            teams: true
        })
        let config!: AuthConfig
        function Capture() {
            config = useAuth()
            return null
        }
        render(
            <StackProvider
                stack={stack}
                overrides={{
                    auth: {
                        authClient: createAuthClient(),
                        plugins: [organization]
                    }
                }}
            >
                <BetterAuthPluginProvider organizationSlug="@acme">
                    <Capture />
                </BetterAuthPluginProvider>
            </StackProvider>
        )
        expect(config.plugins[0]).toHaveProperty("slug", "acme")
        expect(organization.slug).not.toBe("acme")
    })

    it("isolates fallback QueryClients between independently rendered providers", () => {
        const clients: QueryClient[] = []
        function Capture() {
            clients.push(useQueryClient())
            return null
        }
        const props = { authClient: createAuthClient(), navigate: vi.fn() }
        render(
            <>
                <AuthProvider {...props}>
                    <Capture />
                </AuthProvider>
                <AuthProvider {...props}>
                    <Capture />
                </AuthProvider>
            </>
        )
        expect(clients[0]).not.toBe(clients[1])
    })

    it("hydrates the request-scoped native session without a refetch or mismatch", async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { staleTime: Infinity } }
        })
        queryClient.setQueryData(authQueryKeys.session, session)
        const getSession = vi.fn(
            async () => new Response(JSON.stringify(session))
        )
        const authClient = createAuthClient({
            fetchOptions: { customFetchImpl: getSession }
        })
        function Capture() {
            return <div>{useSession(authClient).data?.user.name}</div>
        }
        const tree = (
            <AuthProvider
                authClient={authClient}
                queryClient={queryClient}
                navigate={vi.fn()}
            >
                <Capture />
            </AuthProvider>
        )
        const container = document.createElement("div")
        container.innerHTML = renderToString(tree)
        document.body.append(container)
        const errors: unknown[] = []
        let root!: ReturnType<typeof hydrateRoot>
        await act(async () => {
            root = hydrateRoot(container, tree, {
                onRecoverableError: (error) => errors.push(error)
            })
        })
        expect(container.textContent).toBe("Ada")
        expect(errors).toEqual([])
        expect(getSession).not.toHaveBeenCalled()
        act(() => root.unmount())
        container.remove()
    })
})

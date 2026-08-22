/**
 * Tests for BetterAuthPluginProvider / plugin-context-bridge.
 *
 * Core concerns:
 *  1. Auth-specific fields (basePath, localization, feature flags) always come
 *     from authOverrides — never from the merged account/org blob.
 *  2. Normalization memos (credentials, emailVerification, avatar, signUp, …)
 *     produce the correct shape.
 *  3. Mutators call the right endpoints with the right HTTP method.
 *  4. Hooks exist and their queryFns call the right endpoints.
 */

import { render } from "@testing-library/react"
import { useContext } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// ─── mocks ────────────────────────────────────────────────────────────────────

vi.mock("@btst/stack/context", () => ({
    useCan: vi.fn(),
    useIdentity: vi.fn(),
    useNotify: vi.fn(),
    usePluginOverrides: vi.fn(),
    useStack: vi.fn(),
    useTranslate: vi.fn()
}))

// Capture queryFns passed to useAuthData so we can call them directly in tests.
const capturedQueryFns: Record<string, () => unknown> = {}
vi.mock("../../hooks/use-auth-data", () => ({
    useAuthData: ({
        queryFn,
        cacheKey
    }: {
        queryFn: () => unknown
        cacheKey: string
    }) => {
        capturedQueryFns[cacheKey] = queryFn
        return {
            data: null,
            isPending: false,
            isRefetching: false,
            error: null,
            refetch: vi.fn()
        }
    }
}))

vi.mock("../../components/captcha/recaptcha-v3", () => ({
    RecaptchaV3: ({ children }: { children: React.ReactNode }) => children
}))

vi.mock("../organization-refetcher", () => ({
    OrganizationRefetcher: () => null
}))

// ─── imports after mocks ──────────────────────────────────────────────────────

import {
    useCan,
    useIdentity,
    useNotify,
    usePluginOverrides,
    useStack,
    useTranslate
} from "@btst/stack/context"
import { AuthUIContext, type AuthUIContextType } from "../auth-ui-provider"
import { BetterAuthPluginProvider } from "../plugin-context-bridge"

// ─── minimal authClient stub ──────────────────────────────────────────────────

const mockFetch = vi.fn()

const mockAuthClient = {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    useListPasskeys: vi.fn(() => ({ data: null })),
    useActiveOrganization: vi.fn(() => ({ data: null })),
    useListOrganizations: vi.fn(() => ({ data: null })),
    $fetch: mockFetch,
    apiKey: {
        delete: vi.fn(),
        list: vi.fn()
    },
    passkey: {
        deletePasskey: vi.fn()
    },
    multiSession: {
        revoke: vi.fn(),
        setActive: vi.fn(),
        listDeviceSessions: vi.fn()
    },
    revokeSession: vi.fn(),
    organization: {
        update: vi.fn(),
        getInvitation: vi.fn()
    },
    updateUser: vi.fn(),
    unlinkAccount: vi.fn(),
    listAccounts: vi.fn(),
    accountInfo: vi.fn(),
    listSessions: vi.fn()
}

// ─── test helpers ─────────────────────────────────────────────────────────────

type Overrides = Record<string, unknown>

/**
 * Render the bridge with controlled overrides and synchronously capture the
 * AuthUIContext value produced by the bridge.
 */
function renderBridge(
    authOv: Overrides = {},
    accountOv: Overrides = {},
    orgOv: Overrides = {}
): AuthUIContextType {
    let capturedCtx!: AuthUIContextType

    vi.mocked(usePluginOverrides).mockImplementation(
        (name: string, defaults?: Partial<unknown> | undefined) => {
            if (name === "auth")
                return { ...defaults, authClient: mockAuthClient, ...authOv }
            if (name === "account") return accountOv
            if (name === "organization") return orgOv
            return {}
        }
    )

    function ContextCapture() {
        capturedCtx = useContext(AuthUIContext)
        return null
    }

    render(
        <BetterAuthPluginProvider>
            <ContextCapture />
        </BetterAuthPluginProvider>
    )

    return capturedCtx
}

// ─── tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStack).mockReturnValue({
        basePath: "/p",
        overrides: {},
        router: {}
    })
    vi.mocked(useCan).mockReturnValue({ can: true, isPending: false })
    vi.mocked(useIdentity).mockReturnValue({
        identity: null,
        isPending: false,
        refetch: vi.fn()
    })
    vi.mocked(useNotify).mockReturnValue({
        error: vi.fn(),
        info: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    })
    vi.mocked(useTranslate).mockReturnValue(
        (_key, defaultValue) => defaultValue
    )
    // biome-ignore lint/suspicious/useIterableCallbackReturn: acceptable use of forEach
    Object.keys(capturedQueryFns).forEach((k) => delete capturedQueryFns[k])
})

// ── 1. Field routing ──────────────────────────────────────────────────────────

describe("field routing — auth-specific fields come from authOverrides only", () => {
    it("uses authOverrides.basePath, not accountOverrides.basePath", () => {
        const ctx = renderBridge(
            { basePath: "/auth" },
            { basePath: "/account" },
            { basePath: "/org" }
        )
        expect(ctx.basePath).toBe("/auth")
    })

    it("strips trailing slash from basePath", () => {
        const ctx = renderBridge({ basePath: "/auth/" })
        expect(ctx.basePath).toBe("/auth")
    })

    it("defaults basePath to /auth when not set", () => {
        const ctx = renderBridge()
        expect(ctx.basePath).toBe("/auth")
    })

    it("uses authOverrides.redirectTo, not accountOverrides.redirectTo", () => {
        const ctx = renderBridge(
            { redirectTo: "/dashboard" },
            { redirectTo: "/account-redirect" }
        )
        expect(ctx.redirectTo).toBe("/dashboard")
    })

    it("uses authOverrides.localization, not accountOverrides.localization", () => {
        const customLocalization = { SIGN_IN: "Log in" } as any
        const ctx = renderBridge(
            { localization: customLocalization },
            { localization: { SIGN_IN: "Account sign in" } as any }
        )
        // Our localization is merged with defaults, so SIGN_IN should be our override
        expect(ctx.localization.SIGN_IN).toBe("Log in")
    })

    it("uses authOverrides feature flags — not org overrides", () => {
        const ctx = renderBridge(
            { magicLink: true, passkey: true, twoFactor: ["totp"] as any },
            {},
            { magicLink: false, passkey: false } // org tries to override — must be ignored
        )
        expect(ctx.magicLink).toBe(true)
        expect(ctx.passkey).toBe(true)
        expect(ctx.twoFactor).toEqual(["totp"])
    })

    it("uses authOverrides.freshAge, not accountOverrides.freshAge", () => {
        const ctx = renderBridge({ freshAge: 999 }, { freshAge: 1 })
        expect(ctx.freshAge).toBe(999)
    })

    it("uses authOverrides.changeEmail, not accountOverrides.changeEmail", () => {
        const ctx = renderBridge({ changeEmail: false }, { changeEmail: true })
        expect(ctx.changeEmail).toBe(false)
    })

    it("keeps authOverrides.captcha isolated", () => {
        const captcha = {
            provider: "cloudflare-turnstile",
            siteKey: "key"
        } as any
        const ctx = renderBridge({ captcha }, { captcha: null as any })
        expect(ctx.captcha).toEqual(captcha)
    })
})

// ── 2. Normalization — credentials ───────────────────────────────────────────

describe("credentials normalization", () => {
    it("credentials: true → { forgotPassword: true, usernameRequired: true }", () => {
        const ctx = renderBridge({ credentials: true })
        expect(ctx.credentials).toEqual({
            forgotPassword: true,
            usernameRequired: true
        })
    })

    it("credentials: false → undefined", () => {
        const ctx = renderBridge({ credentials: false })
        expect(ctx.credentials).toBeUndefined()
    })

    it("credentials: undefined → defaults (forgotPassword: true)", () => {
        const ctx = renderBridge({})
        expect(ctx.credentials?.forgotPassword).toBe(true)
        expect(ctx.credentials?.usernameRequired).toBe(true)
    })

    it("credentials object fills in missing defaults", () => {
        const ctx = renderBridge({ credentials: { forgotPassword: false } })
        expect(ctx.credentials?.forgotPassword).toBe(false)
        expect(ctx.credentials?.usernameRequired).toBe(true)
    })

    it("credentials object preserves explicit usernameRequired: false", () => {
        const ctx = renderBridge({
            credentials: { forgotPassword: true, usernameRequired: false }
        })
        expect(ctx.credentials?.usernameRequired).toBe(false)
    })
})

// ── 3. Normalization — emailVerification ─────────────────────────────────────

describe("emailVerification normalization", () => {
    it("emailVerification: true → { otp: false }", () => {
        const ctx = renderBridge({ emailVerification: true })
        expect(ctx.emailVerification).toEqual({ otp: false })
    })

    it("emailVerification: false → undefined", () => {
        const ctx = renderBridge({ emailVerification: false })
        expect(ctx.emailVerification).toBeUndefined()
    })

    it("emailVerification: { otp: true } → { otp: true }", () => {
        const ctx = renderBridge({ emailVerification: { otp: true } })
        expect(ctx.emailVerification).toEqual({ otp: true })
    })

    it("emailVerification: {} defaults otp to false", () => {
        const ctx = renderBridge({ emailVerification: {} })
        expect(ctx.emailVerification).toEqual({ otp: false })
    })
})

// ── 4. Normalization — avatar ─────────────────────────────────────────────────

describe("avatar normalization", () => {
    it("avatar: undefined → undefined", () => {
        const ctx = renderBridge({})
        expect(ctx.avatar).toBeUndefined()
    })

    it("avatar: true → { extension: 'png', size: 128 }", () => {
        const ctx = renderBridge({ avatar: true })
        expect(ctx.avatar).toMatchObject({ extension: "png", size: 128 })
    })

    it("avatar with upload → size defaults to 256", () => {
        const upload = vi.fn()
        const ctx = renderBridge({ avatar: { upload } })
        expect(ctx.avatar?.size).toBe(256)
        expect(ctx.avatar?.upload).toBe(upload)
    })

    it("avatar without upload → size defaults to 128", () => {
        const ctx = renderBridge({ avatar: {} })
        expect(ctx.avatar?.size).toBe(128)
    })
})

// ── 5. Normalization — signUp ─────────────────────────────────────────────────

describe("signUp normalization", () => {
    it("signUp: false → undefined", () => {
        const ctx = renderBridge({ signUp: false })
        expect(ctx.signUp).toBeUndefined()
    })

    it("signUp: true → { fields: ['name'] }", () => {
        const ctx = renderBridge({ signUp: true })
        expect(ctx.signUp).toEqual({ fields: ["name"] })
    })

    it("signUp: undefined → { fields: ['name'] } default", () => {
        const ctx = renderBridge({})
        expect(ctx.signUp).toEqual({ fields: ["name"] })
    })

    it("signUp with custom fields is preserved", () => {
        const ctx = renderBridge({ signUp: { fields: ["name", "username"] } })
        expect(ctx.signUp?.fields).toEqual(["name", "username"])
    })
})

// ── 6. Account memo ───────────────────────────────────────────────────────────

describe("account memo (from accountOverrides)", () => {
    it("account: undefined → context.account is undefined", () => {
        const ctx = renderBridge({}, {})
        expect(ctx.account).toBeUndefined()
    })

    it("account: true uses accountOverrides.basePath", () => {
        const ctx = renderBridge({}, { basePath: "/p/account", account: true })
        expect(ctx.account?.basePath).toBe("/p/account")
    })

    it("account object: accountProp.basePath takes priority over root basePath", () => {
        const ctx = renderBridge(
            {},
            {
                basePath: "/root",
                account: { basePath: "/specific-account" }
            }
        )
        expect(ctx.account?.basePath).toBe("/specific-account")
    })

    it("account: true defaults fields to ['image', 'name']", () => {
        const ctx = renderBridge({}, { account: true, basePath: "/account" })
        expect(ctx.account?.fields).toEqual(["image", "name"])
    })

    it("account object preserves custom fields", () => {
        const ctx = renderBridge(
            {},
            {
                account: {
                    fields: ["image", "name", "username"],
                    basePath: "/acc"
                }
            }
        )
        expect(ctx.account?.fields).toContain("username")
    })
})

// ── 7. Organization memo ──────────────────────────────────────────────────────

describe("organization memo (from organizationOverrides)", () => {
    it("no organization override → context.organization is undefined", () => {
        const ctx = renderBridge({}, {}, {})
        expect(ctx.organization).toBeUndefined()
    })

    it("organization: true uses organizationOverrides.basePath", () => {
        const ctx = renderBridge(
            {},
            {},
            { basePath: "/p/org", organization: true }
        )
        expect(ctx.organization?.basePath).toBe("/p/org")
    })

    it("organization.basePath takes priority over root basePath", () => {
        const ctx = renderBridge(
            {},
            {},
            {
                basePath: "/root",
                organization: { basePath: "/specific-org", customRoles: [] }
            }
        )
        expect(ctx.organization?.basePath).toBe("/specific-org")
    })

    it("logo: true defaults to { extension: 'png', size: 128 }", () => {
        const ctx = renderBridge(
            {},
            {},
            {
                organization: {
                    basePath: "/org",
                    logo: true,
                    customRoles: []
                }
            }
        )
        expect(ctx.organization?.logo).toMatchObject({
            extension: "png",
            size: 128
        })
    })

    it("logo with upload function → size defaults to 256", () => {
        const upload = vi.fn()
        const ctx = renderBridge(
            {},
            {},
            {
                organization: {
                    basePath: "/org",
                    logo: { upload },
                    customRoles: []
                }
            }
        )
        expect(ctx.organization?.logo?.size).toBe(256)
    })
})

// ── 8. Mutators ───────────────────────────────────────────────────────────────

describe("mutators — all present and call correct endpoints", () => {
    it("has all required mutators", () => {
        const ctx = renderBridge()
        const required = [
            "deleteApiKey",
            "deletePasskey",
            "revokeDeviceSession",
            "revokeSession",
            "setActiveSession",
            "updateOrganization",
            "updateTeam",
            "updateUser",
            "unlinkAccount"
        ]
        for (const key of required) {
            expect(ctx.mutators[key as keyof typeof ctx.mutators]).toBeTypeOf(
                "function"
            )
        }
    })

    it("updateTeam calls $fetch with POST /organization/update-team", async () => {
        const ctx = renderBridge()
        await ctx.mutators.updateTeam({ teamId: "t1", data: { name: "New" } })
        expect(mockFetch).toHaveBeenCalledWith(
            "/organization/update-team",
            expect.objectContaining({ method: "POST" })
        )
    })

    it("deleteApiKey calls authClient.apiKey.delete", async () => {
        const ctx = renderBridge()
        await ctx.mutators.deleteApiKey({ keyId: "key1" })
        expect(mockAuthClient.apiKey.delete).toHaveBeenCalledWith(
            expect.objectContaining({
                keyId: "key1",
                fetchOptions: { throw: true }
            })
        )
    })

    it("revokeSession calls authClient.revokeSession", async () => {
        const ctx = renderBridge()
        await ctx.mutators.revokeSession({ token: "tok" })
        expect(mockAuthClient.revokeSession).toHaveBeenCalledWith(
            expect.objectContaining({ token: "tok" })
        )
    })

    it("updateUser calls authClient.updateUser", async () => {
        const ctx = renderBridge()
        await ctx.mutators.updateUser({ name: "Jane" })
        expect(mockAuthClient.updateUser).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Jane" })
        )
    })
})

// ── 9. Hooks — structure and endpoint correctness ─────────────────────────────

describe("hooks — all required hooks present", () => {
    it("has all required hooks", () => {
        const ctx = renderBridge()
        const required = [
            "useSession",
            "useListAccounts",
            "useAccountInfo",
            "useListDeviceSessions",
            "useListSessions",
            "useListPasskeys",
            "useListApiKeys",
            "useActiveOrganization",
            "useListOrganizations",
            "useHasPermission",
            "useInvitation",
            "useListInvitations",
            "useListUserInvitations",
            "useListMembers",
            "useListTeams",
            "useListTeamMembers",
            "useListUserTeams"
        ]
        for (const key of required) {
            expect(ctx.hooks[key as keyof typeof ctx.hooks]).toBeTypeOf(
                "function"
            )
        }
    })
})

describe("hooks — useListTeamMembers uses POST (not GET)", () => {
    it("useListTeamMembers queryFn calls $fetch with POST and body", () => {
        // Render to populate capturedQueryFns via the useAuthData mock
        const ctx = renderBridge()

        // Invoke the hook (as a plain function call, not a real React hook call,
        // since useAuthData is fully mocked and doesn't use hook rules here)
        ctx.hooks.useListTeamMembers({ teamId: "team-abc" })

        const qfn = capturedQueryFns['listTeamMembers:{"teamId":"team-abc"}']
        expect(qfn).toBeDefined()

        qfn()

        expect(mockFetch).toHaveBeenCalledWith(
            "/organization/list-team-members",
            expect.objectContaining({ method: "POST" })
        )
    })

    it("useListTeams queryFn hits /organization/list-teams with organizationId", () => {
        const ctx = renderBridge()
        ctx.hooks.useListTeams({ organizationId: "org-1" })

        const qfn = capturedQueryFns['listTeams:{"organizationId":"org-1"}']
        expect(qfn).toBeDefined()
        qfn()

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(
                "/organization/list-teams?organizationId=org-1"
            )
        )
    })

    it("useListUserTeams queryFn hits /organization/list-user-teams", () => {
        const ctx = renderBridge()
        ctx.hooks.useListUserTeams()

        const qfn = capturedQueryFns.listUserTeams
        expect(qfn).toBeDefined()
        qfn()

        expect(mockFetch).toHaveBeenCalledWith("/organization/list-user-teams")
    })
})

describe("BTST v3 top-level providers", () => {
    it("routes organization permission hooks through stack can", () => {
        vi.mocked(useStack).mockReturnValue({
            auth: { can: vi.fn(), getIdentity: vi.fn() },
            basePath: "/p",
            overrides: {},
            router: {}
        })

        const context = renderBridge()
        const permission = context.hooks.useHasPermission({
            organizationId: "org-1",
            permissions: { member: ["update"] }
        })

        expect(permission.data?.success).toBe(true)
        expect(useCan).toHaveBeenCalledWith({
            resource: "member",
            action: "update",
            params: { organizationId: "org-1" }
        })
    })

    it("preserves Better Auth permissions without an explicit stack can mapping", () => {
        const useHasPermission = vi.fn(() => ({
            data: { error: null, success: false },
            isPending: false,
            isRefetching: false
        }))
        vi.mocked(useStack).mockReturnValue({
            auth: { getIdentity: vi.fn() },
            basePath: "/p",
            overrides: {},
            router: {}
        })

        const context = renderBridge({ hooks: { useHasPermission } })
        const permission = context.hooks.useHasPermission({
            organizationId: "org-1",
            permissions: { member: ["update"] }
        })

        expect(permission.data?.success).toBe(false)
        expect(useHasPermission).toHaveBeenCalledOnce()
        expect(useCan).not.toHaveBeenCalled()
    })

    it("fails closed for permission batches that stack cannot represent", () => {
        vi.mocked(useStack).mockReturnValue({
            auth: { can: vi.fn(), getIdentity: vi.fn() },
            basePath: "/p",
            overrides: {},
            router: {}
        })

        const context = renderBridge()
        const permission = context.hooks.useHasPermission({
            organizationId: "org-1",
            permissions: { member: ["update", "delete"] }
        })

        expect(permission.data?.success).toBe(false)
        expect(permission.isPending).toBe(false)
    })

    it("sources navigation and refreshes identity from top-level providers", async () => {
        const navigate = vi.fn()
        const refresh = vi.fn()
        const refetch = vi.fn()
        const StackLink = () => null
        vi.mocked(useIdentity).mockReturnValue({
            identity: null,
            isPending: false,
            refetch
        })
        vi.mocked(useStack).mockReturnValue({
            basePath: "/p",
            overrides: {},
            router: { Link: StackLink, navigate, refresh }
        })

        const context = renderBridge({
            Link: () => null,
            navigate: vi.fn(),
            onSessionChange: vi.fn()
        })

        context.navigate("/account")
        await context.onSessionChange?.()
        expect(context.Link).toBe(StackLink)
        expect(navigate).toHaveBeenCalledWith("/account")
        expect(refetch).toHaveBeenCalledOnce()
        expect(refresh).toHaveBeenCalledOnce()
    })

    it("routes toast rendering through the top-level notify provider", () => {
        const notify = {
            error: vi.fn(),
            info: vi.fn(),
            success: vi.fn(),
            warning: vi.fn()
        }
        vi.mocked(useNotify).mockReturnValue(notify)

        const context = renderBridge({ toast: vi.fn() })
        context.toast({ variant: "success", message: "Saved" })
        context.toast({ message: "Heads up" })

        expect(notify.success).toHaveBeenCalledWith("Saved")
        expect(notify.info).toHaveBeenCalledWith("Heads up")
    })

    it("translates existing localization values through stack i18n", () => {
        const translate = vi.fn((key: string, defaultValue: string) =>
            key === "better-auth-ui.SIGN_IN" ? "Entrar" : defaultValue
        )
        vi.mocked(useTranslate).mockReturnValue(translate)

        const context = renderBridge()

        expect(context.localization.SIGN_IN).toBe("Entrar")
        expect(translate).toHaveBeenCalledWith(
            "better-auth-ui.SIGN_IN",
            expect.any(String)
        )
    })
})

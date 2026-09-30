import { resolveAuthConfig } from "@better-auth-ui/core"
import type { AgentAuthAdapter } from "@better-auth-ui/core/plugins/agent-auth"
import type { BillingAdapter } from "@better-auth-ui/core/plugins/billing"
import { createClientStack } from "@btst/stack/client"
import { QueryClient } from "@tanstack/react-query"
import { createAuthClient } from "better-auth/react"
import { describe, expect, it } from "vitest"
import {
    accountClientPlugin,
    adminClientPlugin,
    authClientPlugin,
    organizationClientPlugin
} from "../../client"
import { createPageMeta } from "../../plugins/meta"
import { adminPlugin } from "../auth/admin-plugin"
import { agentAuthPlugin } from "../auth/agent-auth-plugin"
import { billingPlugin } from "../auth/billing-plugin"
import { dashPlugin } from "../auth/dash-plugin"
import { deviceAuthorizationPlugin } from "../auth/device-authorization-plugin"
import { oauthProviderPlugin } from "../auth/oauth-provider-plugin"
import { organizationPlugin } from "../auth/organization-plugin"
import { phoneNumberPlugin } from "../auth/phone-number-plugin"
import { ssoPlugin } from "../auth/sso-plugin"
import { getEnabledPaths } from "../route-paths"

const authClient = createAuthClient()
const base = { authClient }

const makeStack = () =>
    createClientStack({
        queryClient: new QueryClient(),
        api: { baseURL: "https://example.com", basePath: "/api/data" },
        site: { baseURL: "https://example.com", basePath: "/p" },
        plugins: {
            auth: authClientPlugin(),
            account: accountClientPlugin(),
            organization: organizationClientPlugin(),
            admin: adminClientPlugin()
        }
    })

describe("BTST route integration", () => {
    it("registers server-safe route factories including organization slugs", () => {
        const stack = makeStack()
        const paths = Object.values(stack.context.plugins).flatMap((plugin) =>
            Object.values(plugin.routes(stack.context)).map(
                (route) => (route as { path: string }).path
            )
        )
        expect(paths).toEqual([
            "/auth/:path",
            "/account/:path",
            "/organization/:path",
            "/organization/:slug/:path",
            "/admin/:path"
        ])
    })

    it("keeps optional features unreachable until registered", () => {
        const config = resolveAuthConfig(base)
        expect(getEnabledPaths(config, "auth")).toContain("sign-in")
        expect(getEnabledPaths(config, "auth")).not.toContain("phone-number")
        expect(getEnabledPaths(config, "settings")).toEqual([
            "account",
            "security"
        ])
        expect(getEnabledPaths(config, "organization")).toEqual([])
        expect(getEnabledPaths(config, "admin")).toEqual([])
    })

    it("makes each enabled feature family reachable with custom paths", () => {
        const config = resolveAuthConfig({
            ...base,
            viewPaths: { settings: { account: "settings" } },
            plugins: [
                organizationPlugin({
                    teams: true,
                    dynamicAccessControl: { enabled: true, permissions: {} }
                }),
                adminPlugin(),
                billingPlugin({
                    adapter: {} as BillingAdapter,
                    path: "plans",
                    organization: true
                }),
                dashPlugin({ admin: true, organization: true }),
                ssoPlugin({ organization: true, path: "enterprise" }),
                oauthProviderPlugin({ clientManagement: true }),
                deviceAuthorizationPlugin({ path: "device" }),
                phoneNumberPlugin({ passwordReset: true }),
                agentAuthPlugin({
                    adapter: {} as AgentAuthAdapter,
                    path: "approve-agent"
                })
            ]
        })
        expect(getEnabledPaths(config, "settings")).toEqual(
            expect.arrayContaining([
                "settings",
                "plans",
                "activity",
                "oauth-clients",
                "organizations"
            ])
        )
        expect(getEnabledPaths(config, "auth")).toEqual(
            expect.arrayContaining([
                "device",
                "phone-number",
                "approve-agent",
                "oauth-consent",
                "accept-invitation"
            ])
        )
        expect(getEnabledPaths(config, "organization")).toEqual(
            expect.arrayContaining([
                "settings",
                "people",
                "teams",
                "roles",
                "plans",
                "enterprise",
                "activity"
            ])
        )
        expect(getEnabledPaths(config, "admin")).toEqual(
            expect.arrayContaining(["users", "activity"])
        )
    })

    it("does not enable tabs when a plugin explicitly disables that scope", () => {
        const config = resolveAuthConfig({
            ...base,
            plugins: [
                organizationPlugin(),
                billingPlugin({ adapter: {} as BillingAdapter, user: false }),
                phoneNumberPlugin({ signIn: false, passwordSignIn: false })
            ]
        })
        expect(getEnabledPaths(config, "settings")).not.toContain("billing")
        expect(getEnabledPaths(config, "auth")).not.toContain("phone-number")
        expect(getEnabledPaths(config, "organization")).not.toContain("teams")
        expect(getEnabledPaths(config, "organization")).not.toContain("roles")
    })
})

it("preserves page metadata and excludes private account pages from indexing", () => {
    const runtime = { site: { baseURL: "https://example.com", basePath: "/p" } }
    const auth = createPageMeta(runtime as never, "auth", "sign-in")
    expect(auth).toContainEqual({ name: "title", content: "Sign In" })
    expect(auth).toContainEqual({
        property: "og:url",
        content: "https://example.com/p/auth/sign-in"
    })
    const account = createPageMeta(runtime as never, "account", "settings")
    expect(account).toContainEqual({
        name: "title",
        content: "Account Settings"
    })
    expect(account).toContainEqual({
        name: "robots",
        content: "noindex, nofollow"
    })
})

it("binds dynamic paths to metadata on the resolved Stack router", async () => {
    const stack = makeStack()
    const auth = stack.router.getRoute("/auth/sign-in")
    expect(await auth?.meta?.()).toContainEqual({
        name: "title",
        content: "Sign In"
    })
    const account = stack.router.getRoute("/account/settings")
    expect(await account?.meta?.()).toContainEqual({
        name: "title",
        content: "Account Settings"
    })
    const organization = stack.router.getRoute("/organization/acme/people")
    expect(await organization?.meta?.()).toContainEqual({
        property: "og:url",
        content: "https://example.com/p/organization/acme/people"
    })
})

it("does not advertise unresolved browser-configured auth paths in the sitemap", async () => {
    const stack = makeStack()
    const config = resolveAuthConfig({
        ...base,
        viewPaths: { auth: { signIn: "login" } }
    })
    expect(getEnabledPaths(config, "auth")).toContain("login")
    expect(getEnabledPaths(config, "auth")).not.toContain("sign-in")
    expect(await stack.generateSitemap()).toEqual([])
})

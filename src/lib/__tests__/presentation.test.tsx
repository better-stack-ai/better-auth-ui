import {
    authMutationKeys,
    defaultAuthLocale,
    resolveAuthConfig
} from "@better-auth-ui/core"
import type { BillingAdapter } from "@better-auth-ui/core/plugins/billing"
import { MutationCache, QueryClient } from "@tanstack/react-query"
import { act, render } from "@testing-library/react"
import { createAuthClient } from "better-auth/react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { AuthProvider } from "../../components/auth/auth-provider"
import { billingPlugin } from "../auth/billing-plugin"
import { dashPlugin } from "../auth/dash-plugin"
import { oauthProviderPlugin } from "../auth/oauth-provider-plugin"
import { organizationPlugin } from "../auth/organization-plugin"
import { AuthNotificationsContext } from "../notifications"

it("renders translated plugin tab labels after upstream locale resolution", () => {
    const config = resolveAuthConfig({
        authClient: createAuthClient(),
        locale: {
            ...defaultAuthLocale,
            plugins: {
                billing: { billing: "Plans traduits" },
                dash: { activity: "Activité" },
                organization: { organizations: "Organisations" },
                oauthProvider: { oauthClients: "Clients OAuth" }
            }
        },
        plugins: [
            billingPlugin({
                adapter: {} as BillingAdapter,
                organization: true
            }),
            dashPlugin({ admin: true, organization: true }),
            organizationPlugin(),
            oauthProviderPlugin({ clientManagement: true })
        ]
    })
    const labels = config.plugins.flatMap((plugin) =>
        [
            ...(plugin.settingsTabs ?? []),
            ...(plugin.organizationTabs ?? []),
            ...(plugin.adminTabs ?? [])
        ].map((tab) => renderToStaticMarkup(<>{tab.label}</>))
    )
    expect(labels.some((label) => label.includes("Plans traduits"))).toBe(true)
    expect(labels.some((label) => label.includes("Activité"))).toBe(true)
    expect(labels.some((label) => label.includes("Organisations"))).toBe(true)
    expect(labels.some((label) => label.includes("Clients OAuth"))).toBe(true)
})

describe("nested providers", () => {
    it("notifies once through BTST and restores the original cache handler after unmount", async () => {
        const original = vi.fn()
        const queryClient = new QueryClient({
            mutationCache: new MutationCache({ onError: original })
        })
        const notification = vi.fn()
        const authClient = createAuthClient()
        const log = vi.spyOn(console, "error").mockImplementation(() => {})
        const props = { authClient, queryClient, navigate: vi.fn() }
        const view = render(
            <AuthProvider {...props}>
                <AuthNotificationsContext.Provider
                    value={{ error: notification, success: vi.fn() }}
                >
                    <AuthProvider {...props}>
                        <div />
                    </AuthProvider>
                </AuthNotificationsContext.Provider>
            </AuthProvider>
        )
        const error = new Error("Request denied")
        const mutation = queryClient.getMutationCache().build(queryClient, {
            mutationKey: [...authMutationKeys.all, "test"],
            meta: { errorPresentation: "toast" },
            mutationFn: async () => {
                throw error
            }
        })
        await act(async () => {
            await expect(mutation.execute(undefined)).rejects.toThrow(
                "Request denied"
            )
        })
        expect(notification).toHaveBeenCalledTimes(1)
        expect(original).toHaveBeenCalledTimes(1)
        view.unmount()
        expect(queryClient.getMutationCache().config.onError).toBe(original)
        log.mockRestore()
    })
})

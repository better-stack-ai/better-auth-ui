import {
    authMutationKeys,
    defaultAuthLocale,
    resolveAuthConfig
} from "@better-auth-ui/core"
import type { BillingAdapter } from "@better-auth-ui/core/plugins/billing"
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { act, render } from "@testing-library/react"
import { createAuthClient } from "better-auth/react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { AuthProvider } from "../../components/auth/auth-provider"
import { billingPlugin } from "../auth/billing-plugin"
import { dashPlugin } from "../auth/dash-plugin"
import { oauthProviderPlugin } from "../auth/oauth-provider-plugin"
import { organizationPlugin } from "../auth/organization-plugin"
import { registerErrorNotifications } from "../error-notifications"
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
        ].map((tab) => renderToStaticMarkup(tab.label))
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

it("preserves native mutation invalidation after a nested provider unmounts", async () => {
    const client = new QueryClient()
    const authClient = createAuthClient()
    const props = { authClient, queryClient: client, navigate: vi.fn() }
    const view = render(
        <AuthProvider {...props}>
            <AuthProvider {...props}>
                <div />
            </AuthProvider>
        </AuthProvider>
    )
    view.rerender(
        <AuthProvider {...props}>
            <div />
        </AuthProvider>
    )
    const key = ["auth", "regression"]
    client.setQueryData(key, "cached")
    const mutation = client.getMutationCache().build(client, {
        mutationKey: [...authMutationKeys.all, "test"],
        meta: { invalidates: [key] },
        mutationFn: async () => "updated"
    })
    await act(async () => {
        await mutation.execute(undefined)
    })
    expect(client.getQueryState(key)?.isInvalidated).toBe(true)
})

it.each([
    true,
    false
])("retains shared error handling when subscribers unmount in either order (%s)", (removeCustomFirst) => {
    const original = vi.fn()
    const client = new QueryClient({
        queryCache: new QueryCache({ onError: original })
    })
    const defaultError = vi.fn()
    const customError = vi.fn()
    const removeDefault = registerErrorNotifications(client, {
        query: defaultError,
        mutation: vi.fn(),
        priority: 0
    })
    const removeCustom = registerErrorNotifications(client, {
        query: customError,
        mutation: vi.fn(),
        priority: 1
    })
    const query = client
        .getQueryCache()
        .build<unknown, unknown>(client, { queryKey: ["test"] })
    const error = new Error("Denied")
    client.getQueryCache().config.onError?.(error, query)
    expect(customError).toHaveBeenCalledTimes(1)
    expect(defaultError).not.toHaveBeenCalled()
    const first = removeCustomFirst ? removeCustom : removeDefault
    const last = removeCustomFirst ? removeDefault : removeCustom
    first()
    client.getQueryCache().config.onError?.(error, query)
    expect(
        removeCustomFirst ? defaultError : customError
    ).toHaveBeenCalledTimes(removeCustomFirst ? 1 : 2)
    last()
    expect(client.getQueryCache().config.onError).toBe(original)
    expect(original).toHaveBeenCalledTimes(2)
})

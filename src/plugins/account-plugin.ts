import {
    defineClientPlugin,
    type ResolvedClientPluginRuntime
} from "@btst/stack/plugins/client"
import { defineRoute, defineRoutes } from "@btst/yar"
import { lazy } from "react"
import type { AccountViewProps } from "../components/account/account-view"
import { accountViewPaths } from "../lib/view-paths"
import type { AuthLocalization } from "../localization/auth-localization"
import type { AccountOptions } from "../types/account-options"
import type { AvatarOptions } from "../types/avatar-options"
import type { DeleteUserOptions } from "../types/delete-user-options"
import type { TeamOptions } from "../types/team-options"

/**
 * Per-page customization props for account views.
 * Passed via AccountPluginOverrides.pageProps.accountSettings, etc.
 */
export type AccountPageProps = Omit<
    AccountViewProps,
    "path" | "pathname" | "view" | "localization"
> & {
    localization?: Partial<AuthLocalization>
}

export type AccountPluginOptions = Omit<Partial<AccountOptions>, "basePath">

/**
 * Plugin override interface for account plugin
 * Contains only account-specific options consumed by the bridge.
 */
export interface AccountPluginOverrides {
    /**
     * Enable account view & account configuration
     * @default { fields: ["image", "name"] }
     */
    account?: boolean | AccountPluginOptions
    /**
     * Avatar configuration
     */
    avatar?: boolean | AvatarOptions
    /**
     * User Account deletion configuration
     * @default undefined
     */
    deleteUser?: DeleteUserOptions | boolean
    /**
     * Enable teams feature
     * @default undefined
     */
    teams?: TeamOptions | boolean
    /**
     * Called when a route error occurs
     */
    onRouteError?: (
        routeName: string,
        error: Error,
        context: { path: string; isSSR: boolean }
    ) => void
    /**
     * Per-page props (className, classNames, localization, etc.)
     * passed directly to each account view component.
     */
    pageProps?: {
        accountSettings?: AccountPageProps
        accountSecurity?: AccountPageProps
        accountApiKeys?: AccountPageProps
        accountOrganizations?: AccountPageProps
        accountTeams?: AccountPageProps
    }
}

// Meta generator factory for account pages
function createAuthMeta(
    config: ResolvedClientPluginRuntime<"account">,
    path: string,
    title: string,
    description: string
) {
    return () => {
        const fullUrl = `${config.site.baseURL}${config.site.basePath}${path}`

        return [
            { name: "title", content: title },
            { name: "description", content: description },
            { property: "og:title", content: title },
            { property: "og:description", content: description },
            { property: "og:type", content: "website" },
            { property: "og:url", content: fullUrl },
            { name: "twitter:card", content: "summary" },
            { name: "twitter:title", content: title },
            { name: "twitter:description", content: description }
        ]
    }
}

/**
 * Account client plugin
 * Provides routes, components, and meta for account management flows
 *
 * Shared site runtime is inherited from createClientStack.
 */
function createResolvedAccountPlugin(
    config: ResolvedClientPluginRuntime<"account">
) {
    return {
        routes: () =>
            defineRoutes({
                // Account views
                accountSettings: defineRoute(
                    `/account/${accountViewPaths.SETTINGS}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/account/pages/account-settings-page"
                            ).then((m) => ({
                                default: m.AccountSettingsPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/account/${accountViewPaths.SETTINGS}`,
                            "Account Settings",
                            "Manage your account settings"
                        )
                    }
                ),
                accountSecurity: defineRoute(
                    `/account/${accountViewPaths.SECURITY}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/account/pages/account-security-page"
                            ).then((m) => ({
                                default: m.AccountSecurityPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/account/${accountViewPaths.SECURITY}`,
                            "Security",
                            "Manage your security settings"
                        )
                    }
                ),
                accountApiKeys: defineRoute(
                    `/account/${accountViewPaths.API_KEYS}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/account/pages/account-api-keys-page"
                            ).then((m) => ({
                                default: m.AccountApiKeysPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/account/${accountViewPaths.API_KEYS}`,
                            "API Keys",
                            "Manage your API keys"
                        )
                    }
                ),
                accountOrganizations: defineRoute(
                    `/account/${accountViewPaths.ORGANIZATIONS}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/account/pages/account-organizations-page"
                            ).then((m) => ({
                                default: m.AccountOrganizationsPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/account/${accountViewPaths.ORGANIZATIONS}`,
                            "Organizations",
                            "Manage your organizations"
                        )
                    }
                ),
                accountTeams: defineRoute(
                    `/account/${accountViewPaths.TEAMS}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/account/pages/account-teams-page"
                            ).then((m) => ({
                                default: m.AccountTeamsPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/account/${accountViewPaths.TEAMS}`,
                            "Teams",
                            "Manage your team memberships"
                        )
                    }
                )
            }),
        sitemap: async () => {
            return []
        }
    }
}

export const accountClientPlugin = () =>
    defineClientPlugin<AccountPluginOverrides>()({
        id: "account",
        resolve: createResolvedAccountPlugin
    })

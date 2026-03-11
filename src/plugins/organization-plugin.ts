import {
    type ClientPlugin,
    createRoute,
    defineClientPlugin,
    type Route
} from "@btst/stack/plugins/client"
import { lazy } from "react"
import type { OrganizationViewPageProps } from "../components/organization/organization-view"
import { organizationViewPaths } from "../lib/view-paths"
import type { AuthLocalization } from "../localization/auth-localization"
import type { OrganizationOptions } from "../types/organization-options"
import type { TeamOptions } from "../types/team-options"
import type { AuthPluginOverrides } from "./auth-plugin"

/**
 * Per-page customization props for organization views.
 * Passed via OrganizationPluginOverrides.pageProps.organizationSettings, etc.
 */
export type OrganizationPageProps = Omit<
    OrganizationViewPageProps,
    "path" | "pathname" | "view" | "localization"
> & {
    localization?: Partial<AuthLocalization>
}

/**
 * Configuration for organization client plugin
 */
export interface OrganizationClientConfig {
    siteBaseURL: string
    siteBasePath: string

    // Optional context to pass to loaders (for SSR)
    context?: Record<string, unknown>
}

/**
 * Plugin override interface for organization plugin
 * Extends AuthPluginOverrides with organization-specific options
 */
export interface OrganizationPluginOverrides
    extends Partial<AuthPluginOverrides> {
    /**
     * Organization plugin configuration
     * @default undefined
     */
    organization?: OrganizationOptions | boolean
    /**
     * Enable teams feature within organizations
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
     * passed directly to each organization view component.
     */
    pageProps?: NonNullable<AuthPluginOverrides["pageProps"]> & {
        organizationSettings?: OrganizationPageProps
        organizationMembers?: OrganizationPageProps
        organizationApiKeys?: OrganizationPageProps
        organizationTeams?: OrganizationPageProps
    }
}

// Curried helper: pins TOverrides=OrganizationPluginOverrides while letting TRoutes be inferred.
// See auth-plugin.ts for explanation of why this pattern is needed.
function definePlugin<TRoutes extends Record<string, Route>>(
    plugin: ClientPlugin<OrganizationPluginOverrides, TRoutes>
): ClientPlugin<OrganizationPluginOverrides, TRoutes> {
    return defineClientPlugin(plugin)
}

// Meta generator factory for organization pages
function createAuthMeta(
    config: OrganizationClientConfig,
    path: string,
    title: string,
    description: string
) {
    return () => {
        const { siteBaseURL, siteBasePath } = config
        const fullUrl = `${siteBaseURL}${siteBasePath}${path}`

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
 * Organization client plugin
 * Provides routes, components, and meta for organization management flows
 *
 * @param config - Configuration including queryClient and URLs
 */
export const organizationClientPlugin = (config: OrganizationClientConfig) =>
    definePlugin({
        name: "organization",
        routes: () => ({
            organizationSettings: createRoute(
                `/organization/${organizationViewPaths.SETTINGS}`,
                () => {
                    const OrganizationSettingsPage = lazy(() =>
                        import(
                            "../components/organization/pages/organization-settings-page"
                        ).then((m) => ({
                            default: m.OrganizationSettingsPage
                        }))
                    )

                    return {
                        PageComponent: OrganizationSettingsPage,
                        meta: createAuthMeta(
                            config,
                            `/organization/${organizationViewPaths.SETTINGS}`,
                            "Organization Settings",
                            "Manage your organization settings"
                        )
                    }
                }
            ),
            organizationMembers: createRoute(
                `/organization/${organizationViewPaths.MEMBERS}`,
                () => {
                    const OrganizationMembersPage = lazy(() =>
                        import(
                            "../components/organization/pages/organization-members-page"
                        ).then((m) => ({
                            default: m.OrganizationMembersPage
                        }))
                    )

                    return {
                        PageComponent: OrganizationMembersPage,
                        meta: createAuthMeta(
                            config,
                            `/organization/${organizationViewPaths.MEMBERS}`,
                            "Organization Members",
                            "Manage organization members"
                        )
                    }
                }
            ),
            organizationApiKeys: createRoute(
                `/organization/${organizationViewPaths.API_KEYS}`,
                () => {
                    const OrganizationApiKeysPage = lazy(() =>
                        import(
                            "../components/organization/pages/organization-api-keys-page"
                        ).then((m) => ({
                            default: m.OrganizationApiKeysPage
                        }))
                    )

                    return {
                        PageComponent: OrganizationApiKeysPage,
                        meta: createAuthMeta(
                            config,
                            `/organization/${organizationViewPaths.API_KEYS}`,
                            "Organization API Keys",
                            "Manage organization API keys"
                        )
                    }
                }
            ),
            organizationTeams: createRoute(
                `/organization/${organizationViewPaths.TEAMS}`,
                () => {
                    const OrganizationTeamsPage = lazy(() =>
                        import(
                            "../components/organization/pages/organization-teams-page"
                        ).then((m) => ({
                            default: m.OrganizationTeamsPage
                        }))
                    )

                    return {
                        PageComponent: OrganizationTeamsPage,
                        meta: createAuthMeta(
                            config,
                            `/organization/${organizationViewPaths.TEAMS}`,
                            "Organization Teams",
                            "Manage organization teams"
                        )
                    }
                }
            )
        }),
        sitemap: async () => {
            return []
        }
    })

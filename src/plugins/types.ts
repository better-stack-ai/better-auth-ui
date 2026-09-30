import type { AuthProviderProps } from "@better-auth-ui/react"
import type { AdminProps } from "../components/auth/admin/admin"
import type { AuthProps } from "../components/auth/auth"
import type { OrganizationProps } from "../components/auth/organization/organization"
import type { SettingsProps } from "../components/auth/settings/settings"
import type { AuthPlugin } from "../lib/auth/auth-plugin"

export type RouteErrorHandler = (
    routeName: string,
    error: Error,
    context: { path: string; isSSR: boolean }
) => void

export type AuthPageProps = Omit<AuthProps, "path" | "view">
export type AccountPageProps = Omit<SettingsProps, "path" | "view">
export type OrganizationPageProps = Omit<OrganizationProps, "path" | "view">
export type AdminPageProps = Omit<AdminProps, "path" | "view">

export type AuthPluginOverrides = Omit<
    AuthProviderProps,
    "children" | "navigate" | "Link" | "queryClient" | "basePaths" | "plugins"
> & {
    plugins?: AuthPlugin[]
    onSessionChange?: () => void | Promise<void>
    onRouteError?: RouteErrorHandler
    pageProps?: Record<string, AuthPageProps>
}

export interface AccountPluginOverrides {
    pageProps?: Record<string, AccountPageProps>
    onRouteError?: RouteErrorHandler
}
export interface OrganizationPluginOverrides {
    pageProps?: Record<string, OrganizationPageProps>
    onRouteError?: RouteErrorHandler
}
export interface AdminPluginOverrides {
    pageProps?: Record<string, AdminPageProps>
    onRouteError?: RouteErrorHandler
}

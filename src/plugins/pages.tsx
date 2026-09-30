"use client"

import { useAuth } from "@better-auth-ui/react"
import { ComposedRoute } from "@btst/stack/client/components"
import { usePluginOverrides } from "@btst/stack/context"
import { lazy } from "react"
import { BetterAuthPluginProvider } from "../lib/plugin-context-bridge"
import { type AuthSection, getEnabledPaths } from "../lib/route-paths"
import type {
    AccountPageProps,
    AuthPageProps,
    RouteErrorHandler
} from "./types"

const Auth = lazy(() =>
    import("../components/auth/auth").then((m) => ({ default: m.Auth }))
)
const Settings = lazy(() =>
    import("../components/auth/settings/settings").then((m) => ({
        default: m.Settings
    }))
)
const Organization = lazy(() =>
    import("../components/auth/organization/organization").then((m) => ({
        default: m.Organization
    }))
)
const Admin = lazy(() =>
    import("../components/auth/admin/admin").then((m) => ({ default: m.Admin }))
)

const Loading = () => (
    <div role="status" aria-label="Loading" className="animate-pulse p-6">
        Loading…
    </div>
)
const NotFound = () => <div role="status">Page not found</div>
const RouteError = () => <div role="alert">Unable to load this page.</div>

type PageProps = { path: string; slug?: string }
type RouteProps = PageProps & { section: AuthSection }

function PageContent({ section, path }: RouteProps) {
    const config = useAuth()
    const pluginId = section === "settings" ? "account" : section
    const { pageProps } = usePluginOverrides<{
        pageProps?: Record<string, AuthPageProps & AccountPageProps>
    }>(pluginId)
    if (!getEnabledPaths(config, section).includes(path)) return <NotFound />
    const Component = {
        auth: Auth,
        settings: Settings,
        organization: Organization,
        admin: Admin
    }[section]
    return <Component {...pageProps?.[path]} path={path} />
}

function PageInternal(props: RouteProps) {
    return (
        <BetterAuthPluginProvider organizationSlug={props.slug}>
            <PageContent {...props} />
        </BetterAuthPluginProvider>
    )
}

function PluginPage({ section, path, slug }: RouteProps) {
    const pluginId = section === "settings" ? "account" : section
    const { onRouteError } = usePluginOverrides<{
        onRouteError?: RouteErrorHandler
    }>(pluginId)
    const fullPath = `/${pluginId}/${slug ? `${slug}/` : ""}${path}`
    return (
        <ComposedRoute
            path={fullPath}
            PageComponent={PageInternal}
            props={{ section, path, slug }}
            LoadingComponent={Loading}
            ErrorComponent={RouteError}
            NotFoundComponent={NotFound}
            onError={(error) =>
                onRouteError?.(path, error, {
                    path: fullPath,
                    isSSR: typeof window === "undefined"
                })
            }
        />
    )
}

export const AuthPage = (props: PageProps) => (
    <PluginPage {...props} section="auth" />
)
export const AccountPage = (props: PageProps) => (
    <PluginPage {...props} section="settings" />
)
export const OrganizationPage = (props: PageProps) => (
    <PluginPage {...props} section="organization" />
)
export const AdminPage = (props: PageProps) => (
    <PluginPage {...props} section="admin" />
)

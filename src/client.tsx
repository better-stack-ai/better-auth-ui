import { defineClientPlugin } from "@btst/stack/plugins/client"
import { defineRoute, defineRoutes } from "@btst/yar"
import { lazy } from "react"
import { createPageMeta } from "./plugins/meta"
import type {
    AccountPluginOverrides,
    AdminPluginOverrides,
    AuthPluginOverrides,
    OrganizationPluginOverrides
} from "./plugins/types"

export type * from "./plugins/types"

const AuthPage = lazy(() =>
    import("./plugins/pages").then((m) => ({ default: m.AuthPage }))
)
const AccountPage = lazy(() =>
    import("./plugins/pages").then((m) => ({ default: m.AccountPage }))
)
const OrganizationPage = lazy(() =>
    import("./plugins/pages").then((m) => ({ default: m.OrganizationPage }))
)
const AdminPage = lazy(() =>
    import("./plugins/pages").then((m) => ({ default: m.AdminPage }))
)

export const authClientPlugin = () =>
    defineClientPlugin<AuthPluginOverrides>()({
        id: "auth",
        resolve: (runtime) => ({
            routes: () =>
                defineRoutes({
                    auth: defineRoute("/auth/:path", {
                        page: ({ params }) => <AuthPage path={params.path} />,
                        meta: ({ params }) =>
                            createPageMeta(runtime, "auth", params.path)
                    })
                })
        })
    })

export const accountClientPlugin = () =>
    defineClientPlugin<AccountPluginOverrides>()({
        id: "account",
        resolve: (runtime) => ({
            routes: () =>
                defineRoutes({
                    account: defineRoute("/account/:path", {
                        page: ({ params }) => (
                            <AccountPage path={params.path} />
                        ),
                        meta: ({ params }) =>
                            createPageMeta(runtime, "account", params.path)
                    })
                })
        })
    })

export const organizationClientPlugin = () =>
    defineClientPlugin<OrganizationPluginOverrides>()({
        id: "organization",
        resolve: (runtime) => ({
            routes: () =>
                defineRoutes({
                    organization: defineRoute("/organization/:path", {
                        page: ({ params }) => (
                            <OrganizationPage path={params.path} />
                        ),
                        meta: ({ params }) =>
                            createPageMeta(runtime, "organization", params.path)
                    }),
                    organizationBySlug: defineRoute(
                        "/organization/:slug/:path",
                        {
                            page: ({ params }) => (
                                <OrganizationPage
                                    path={params.path}
                                    slug={params.slug}
                                />
                            ),
                            meta: ({ params }) =>
                                createPageMeta(
                                    runtime,
                                    "organization",
                                    params.path,
                                    params.slug
                                )
                        }
                    )
                })
        })
    })

export const adminClientPlugin = () =>
    defineClientPlugin<AdminPluginOverrides>()({
        id: "admin",
        resolve: (runtime) => ({
            routes: () =>
                defineRoutes({
                    admin: defineRoute("/admin/:path", {
                        page: ({ params }) => <AdminPage path={params.path} />,
                        meta: ({ params }) =>
                            createPageMeta(runtime, "admin", params.path)
                    })
                })
        })
    })

"use client"

import {
    type AuthConfig,
    defaultAuthConfig,
    resolveAuthConfig
} from "@better-auth-ui/core"
import { useAuth, useSession } from "@better-auth-ui/react"
import {
    useNotify,
    usePluginOverrides,
    usePluginSiteNavigation,
    useStack,
    useTranslate
} from "@btst/stack/context"
import {
    type ComponentProps,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef
} from "react"
import { AuthProvider } from "../components/auth/auth-provider"
import type { AuthPluginOverrides } from "../plugins/types"
import { AuthNotificationsContext } from "./notifications"

function SessionChangeListener({
    onSessionChange
}: Pick<AuthPluginOverrides, "onSessionChange">) {
    const { authClient } = useAuth()
    const { data, isPending } = useSession(authClient)
    const previous = useRef<string | null | undefined>(undefined)
    const identity = data ? `${data.user.id}:${data.session.id}` : null
    useEffect(() => {
        if (isPending) return
        if (previous.current !== undefined && previous.current !== identity)
            void onSessionChange?.()
        previous.current = identity
    }, [identity, isPending, onSessionChange])
    return null
}

/** Translate the upstream nested string dictionary using stable BTST keys. */
function translateMessages<T>(
    value: T,
    translate: ReturnType<typeof useTranslate>,
    prefix = "auth"
): T {
    if (typeof value === "string") return translate(prefix, value) as T
    if (!value || typeof value !== "object" || Array.isArray(value))
        return value
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            translateMessages(item, translate, `${prefix}.${key}`)
        ])
    ) as T
}

/** Uses native Better Auth sessions and permissions; Stack provides presentation services. */
export function BetterAuthPluginProvider({
    children,
    organizationSlug
}: {
    children: ReactNode
    organizationSlug?: string
}) {
    const { router, queryClient } = useStack()
    const notify = useNotify()
    const translate = useTranslate()
    const authNavigation = usePluginSiteNavigation("auth")
    const accountNavigation = usePluginSiteNavigation("account")
    const organizationNavigation = usePluginSiteNavigation("organization")
    const adminNavigation = usePluginSiteNavigation("admin")
    const {
        onSessionChange,
        onRouteError: _onRouteError,
        pageProps: _pageProps,
        ...config
    } = usePluginOverrides<AuthPluginOverrides>("auth")
    const authPath = authNavigation.resolve("auth").href
    const settingsPath = accountNavigation.resolve("account").href
    const organizationPath = organizationNavigation.resolve("organization").href
    const adminPath = adminNavigation.resolve("admin").href
    const basePaths = useMemo(
        () => ({
            auth: authPath,
            settings: settingsPath,
            organization: organizationPath,
            admin: adminPath
        }),
        [authPath, settingsPath, organizationPath, adminPath]
    )
    const navigate = useCallback(
        ({ to, replace }: { to: string; replace?: boolean }) => {
            if (replace) {
                window.location.replace(to)
                return
            }
            const url = new URL(to, window.location.href)
            if (url.origin !== window.location.origin || !router?.navigate) {
                window.location.assign(to)
                return
            }
            router.navigate(`${url.pathname}${url.search}${url.hash}`)
        },
        [router?.navigate]
    )
    const RouterLink = router?.Link
    const Link = useMemo(
        () =>
            function StackAuthLink(props: ComponentProps<AuthConfig["Link"]>) {
                return RouterLink && !/^https?:\/\//.test(props.href) ? (
                    <RouterLink {...props} />
                ) : (
                    <a {...props} />
                )
            },
        [RouterLink]
    )
    const localization = useMemo(
        () =>
            translateMessages(
                resolveAuthConfig({
                    authClient: config.authClient,
                    locale: config.locale,
                    localization: config.localization
                }).localization,
                translate
            ),
        [config.authClient, config.locale, config.localization, translate]
    )
    const plugins = useMemo(
        () =>
            (config.plugins ?? defaultAuthConfig.plugins).map((plugin) => {
                const localized = {
                    ...plugin,
                    localization: translateMessages(
                        plugin.localization,
                        translate,
                        `auth.plugins.${plugin.id}`
                    )
                }
                if (
                    plugin.id !== "organization" ||
                    organizationSlug === undefined
                )
                    return localized
                const prefix =
                    "slugPrefix" in plugin &&
                    typeof plugin.slugPrefix === "string"
                        ? plugin.slugPrefix
                        : ""
                const slug =
                    prefix && organizationSlug.startsWith(prefix)
                        ? organizationSlug.slice(prefix.length)
                        : organizationSlug
                return { ...localized, slug }
            }),
        [config.plugins, organizationSlug, translate]
    )
    return (
        <AuthNotificationsContext.Provider value={notify}>
            <AuthProvider
                {...config}
                plugins={plugins}
                basePaths={basePaths}
                queryClient={queryClient}
                navigate={navigate}
                Link={Link}
                localization={localization}
            >
                {onSessionChange && (
                    <SessionChangeListener onSessionChange={onSessionChange} />
                )}
                {children}
            </AuthProvider>
        </AuthNotificationsContext.Provider>
    )
}

"use client"

import {
    useNotify,
    usePluginOverrides,
    usePluginSiteNavigation,
    useStack,
    useTranslate
} from "@btst/stack/context"
import { type ReactNode, useMemo } from "react"
import { RecaptchaV3 } from "../components/captcha/recaptcha-v3"
import { useAuthData } from "../hooks/use-auth-data"
import { authLocalization } from "../localization/auth-localization"
import type { AccountPluginOverrides } from "../plugins/account-plugin"
import type { AuthPluginOverrides } from "../plugins/auth-plugin"
import type { OrganizationPluginOverrides } from "../plugins/organization-plugin"
import type { AccountOptionsContext } from "../types/account-options"
import type { AuthClient } from "../types/auth-client"
import type { AuthHooks } from "../types/auth-hooks"
import type { AuthMutators } from "../types/auth-mutators"
import type { AvatarOptions } from "../types/avatar-options"
import type { CredentialsOptions } from "../types/credentials-options"
import type { DeleteUserOptions } from "../types/delete-user-options"
import type { GenericOAuthOptions } from "../types/generic-oauth-options"
import type { Link } from "../types/link"
import type { OrganizationOptionsContext } from "../types/organization-options"
import type { SignUpOptions } from "../types/sign-up-options"
import type { SocialOptions } from "../types/social-options"
import type { TeamOptionsContext } from "../types/team-options"
import { AuthUIContext, type AuthUIContextType } from "./auth-ui-provider"
import { OrganizationRefetcher } from "./organization-refetcher"
import { createRenderToast } from "./stack-adapters"
import {
    accountViewPaths,
    authViewPaths,
    organizationViewPaths
} from "./view-paths"

const DefaultLink: Link = ({ href, className, children }) => (
    <a className={className} href={href}>
        {children}
    </a>
)

const defaultNavigate = (href: string) => {
    window.location.href = href
}

const defaultReplace = (href: string) => {
    window.location.replace(href)
}

/**
 * Bridge component that converts btst plugin overrides to AuthUIContext
 * This allows existing components to continue using AuthUIContext
 * while the plugin system uses overrides
 */
export function BetterAuthPluginProvider({
    children
}: {
    children: ReactNode
}) {
    const { plugins, router } = useStack()
    const notify = useNotify()
    const translate = useTranslate()
    const authNavigation = usePluginSiteNavigation("auth")
    const accountNavigation = usePluginSiteNavigation("account")
    const organizationNavigation = usePluginSiteNavigation("organization")

    // Read auth plugin overrides
    const authOverrides = usePluginOverrides<
        AuthPluginOverrides,
        Partial<AuthPluginOverrides>
    >("auth", {
        localization: authLocalization,
        redirectTo: "/",
        freshAge: 60 * 60 * 24,
        changeEmail: true,
        nameRequired: true
    })

    // Read account plugin overrides (returns defaults if plugin not registered)
    const accountOverrides = usePluginOverrides<
        AccountPluginOverrides,
        Partial<AccountPluginOverrides>
    >("account", {})

    // Read organization plugin overrides (returns defaults if plugin not registered)
    const organizationOverrides = usePluginOverrides<
        OrganizationPluginOverrides,
        Partial<OrganizationPluginOverrides>
    >("organization", {})

    const authClient = authOverrides.authClient as AuthClient
    const authSite = plugins?.auth?.site
    const authLocation = authNavigation.resolve("auth")
    const accountLocation = accountNavigation.resolve("account")
    const organizationLocation = organizationNavigation.resolve("organization")
    const authBasePath = authLocation.href
    const accountBasePath = accountLocation.href
    const organizationBasePath = organizationLocation.href

    const avatar = useMemo<AvatarOptions | undefined>(() => {
        if (!accountOverrides.avatar) return

        if (accountOverrides.avatar === true) {
            return {
                extension: "png",
                size: 128
            }
        }

        return {
            upload: accountOverrides.avatar.upload,
            delete: accountOverrides.avatar.delete,
            extension: accountOverrides.avatar.extension || "png",
            size:
                accountOverrides.avatar.size ||
                (accountOverrides.avatar.upload ? 256 : 128),
            Image: accountOverrides.avatar.Image
        }
    }, [accountOverrides.avatar])

    const account = useMemo<AccountOptionsContext | undefined>(() => {
        const accountProp = accountOverrides?.account
        if (!accountProp) return undefined

        if (accountProp === true) {
            return {
                basePath: accountBasePath,
                fields: ["image", "name"],
                viewPaths: accountViewPaths
            }
        }

        return {
            basePath: accountBasePath,
            fields: accountProp.fields || ["image", "name"],
            viewPaths: { ...accountViewPaths, ...accountProp.viewPaths }
        }
    }, [accountBasePath, accountOverrides.account])

    const deleteUser = useMemo<DeleteUserOptions | undefined>(() => {
        if (!accountOverrides?.deleteUser) return

        if (accountOverrides.deleteUser === true) {
            return {}
        }

        return accountOverrides.deleteUser
    }, [accountOverrides?.deleteUser])

    const social = useMemo<SocialOptions | undefined>(() => {
        return authOverrides.social
    }, [authOverrides.social])

    const genericOAuth = useMemo<GenericOAuthOptions | undefined>(() => {
        return authOverrides.genericOAuth
    }, [authOverrides.genericOAuth])

    const credentials = useMemo<CredentialsOptions | undefined>(() => {
        if (authOverrides.credentials === false) return

        if (authOverrides.credentials === true) {
            return {
                forgotPassword: true,
                usernameRequired: true
            }
        }

        return {
            ...authOverrides.credentials,
            forgotPassword: authOverrides.credentials?.forgotPassword ?? true,
            usernameRequired:
                authOverrides.credentials?.usernameRequired ?? true
        }
    }, [authOverrides.credentials])

    const signUp = useMemo<SignUpOptions | undefined>(() => {
        if (authOverrides.signUp === false) return

        if (
            authOverrides.signUp === true ||
            authOverrides.signUp === undefined
        ) {
            return {
                fields: ["name"]
            }
        }

        return {
            fields: authOverrides.signUp.fields || ["name"]
        }
    }, [authOverrides.signUp])

    const organization = useMemo<OrganizationOptionsContext | undefined>(() => {
        const organizationProp = organizationOverrides?.organization
        if (!organizationProp) return undefined

        if (organizationProp === true) {
            return {
                basePath: organizationBasePath,
                viewPaths: organizationViewPaths,
                customRoles: []
            }
        }

        let logo: OrganizationOptionsContext["logo"] | undefined

        if (organizationProp.logo === true) {
            logo = {
                extension: "png",
                size: 128
            }
        } else if (organizationProp.logo) {
            logo = {
                upload: organizationProp.logo.upload,
                delete: organizationProp.logo.delete,
                extension: organizationProp.logo.extension || "png",
                size:
                    organizationProp.logo.size ||
                    (organizationProp.logo.upload ? 256 : 128)
            }
        }

        return {
            ...organizationProp,
            logo,
            basePath: organizationBasePath,
            customRoles: organizationProp.customRoles || [],
            viewPaths: {
                ...organizationViewPaths,
                ...organizationProp.viewPaths
            }
        }
    }, [organizationBasePath, organizationOverrides.organization])

    const teams = useMemo<TeamOptionsContext | undefined>(() => {
        const teamsProp =
            organizationOverrides?.teams ?? accountOverrides?.teams
        if (!teamsProp || !organization) return

        if (teamsProp === true) {
            return {
                enabled: true,
                customRoles: [],
                colors: {
                    count: 5,
                    prefix: "team"
                }
            }
        }

        return {
            enabled: teamsProp.enabled ?? true,
            customRoles: teamsProp.customRoles || [],
            colors: {
                count: teamsProp.colors?.count ?? 5,
                prefix: teamsProp.colors?.prefix ?? "team"
            }
        }
    }, [organizationOverrides?.teams, accountOverrides?.teams, organization])

    const defaultMutators = useMemo(() => {
        return {
            deleteApiKey: (params) =>
                authClient.apiKey.delete({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            deletePasskey: (params) =>
                authClient.passkey.deletePasskey({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            revokeDeviceSession: (params) =>
                authClient.multiSession.revoke({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            revokeSession: (params) =>
                authClient.revokeSession({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            setActiveSession: (params) =>
                authClient.multiSession.setActive({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            updateOrganization: (params) =>
                authClient.organization.update({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            updateTeam: (params) =>
                authClient.$fetch("/organization/update-team", {
                    method: "POST",
                    body: params,
                    throw: true
                }),
            updateUser: (params) =>
                authClient.updateUser({
                    ...params,
                    fetchOptions: { throw: true }
                }),
            unlinkAccount: (params) =>
                authClient.unlinkAccount({
                    ...params,
                    providerId: params.providerId ?? params.accountId,
                    fetchOptions: { throw: true }
                })
        } as AuthMutators
    }, [authClient])

    const defaultHooks = useMemo(() => {
        return {
            useSession: authClient.useSession,
            useListAccounts: () =>
                useAuthData({
                    queryFn: authClient.listAccounts,
                    cacheKey: "listAccounts"
                }),
            useAccountInfo: (params) =>
                useAuthData({
                    queryFn: () => authClient.accountInfo(params),
                    cacheKey: `accountInfo:${JSON.stringify(params)}`
                }),
            useListDeviceSessions: () =>
                useAuthData({
                    queryFn: authClient.multiSession.listDeviceSessions,
                    cacheKey: "listDeviceSessions"
                }),
            useListSessions: () =>
                useAuthData({
                    queryFn: authClient.listSessions,
                    cacheKey: "listSessions"
                }),
            useListPasskeys: authClient.useListPasskeys,
            useListApiKeys: () =>
                useAuthData({
                    queryFn: authClient.apiKey.list,
                    cacheKey: "listApiKeys"
                }),
            useActiveOrganization: authClient.useActiveOrganization,
            useListOrganizations: authClient.useListOrganizations,
            useHasPermission: (params) =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch("/organization/has-permission", {
                            method: "POST",
                            body: params
                        }),
                    cacheKey: `hasPermission:${JSON.stringify(params)}`
                }),
            useInvitation: (params) =>
                useAuthData({
                    queryFn: () =>
                        authClient.organization.getInvitation(params),
                    cacheKey: `invitation:${JSON.stringify(params)}`
                }),
            useListInvitations: (params) =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch(
                            `/organization/list-invitations?organizationId=${params?.query?.organizationId || ""}`
                        ),
                    cacheKey: `listInvitations:${JSON.stringify(params)}`
                }),
            useListUserInvitations: () =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch(
                            "/organization/list-user-invitations"
                        ),
                    cacheKey: `listUserInvitations`
                }),
            useListMembers: (params) =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch(
                            `/organization/list-members?organizationId=${params?.query?.organizationId || ""}`
                        ),
                    cacheKey: `listMembers:${JSON.stringify(params)}`
                }),
            useListTeams: (params?: { organizationId?: string }) =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch(
                            `/organization/list-teams?organizationId=${params?.organizationId || ""}`
                        ),
                    cacheKey: `listTeams:${JSON.stringify(params)}`
                }),
            useListTeamMembers: (params: { teamId?: string }) =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch("/organization/list-team-members", {
                            method: "POST",
                            body: params?.teamId
                                ? { query: { teamId: params.teamId } }
                                : undefined
                        }),
                    cacheKey: `listTeamMembers:${JSON.stringify(params)}`
                }),
            useListUserTeams: () =>
                useAuthData({
                    queryFn: () =>
                        authClient.$fetch("/organization/list-user-teams"),
                    cacheKey: "listUserTeams"
                })
        } as AuthHooks
    }, [authClient])

    const viewPaths = useMemo(() => {
        return { ...authViewPaths, ...authOverrides.viewPaths }
    }, [authOverrides.viewPaths])

    const localization = useMemo(() => {
        const merged = { ...authLocalization, ...authOverrides.localization }

        return Object.fromEntries(
            Object.entries(merged).map(([key, defaultValue]) => [
                key,
                translate(`better-auth-ui.${key}`, defaultValue)
            ])
        ) as typeof authLocalization
    }, [authOverrides.localization, translate])

    const renderToast = useMemo(() => createRenderToast(notify), [notify])

    const hooks = useMemo(() => {
        return {
            ...defaultHooks,
            ...authOverrides.hooks
        }
    }, [defaultHooks, authOverrides.hooks])

    const mutators = useMemo(() => {
        return { ...defaultMutators, ...authOverrides.mutators }
    }, [defaultMutators, authOverrides.mutators])

    const baseURL = authLocation.crossOrigin
        ? ""
        : (authSite?.baseURL.replace(/\/+$/, "") ?? "")

    const navigate = (href: string) => {
        if (/^https?:\/\//.test(href)) return defaultNavigate(href)
        if (router?.navigate) return router.navigate(href)
        return defaultNavigate(href)
    }

    const replace = (href: string) => {
        if (/^https?:\/\//.test(href)) return defaultReplace(href)
        if (router?.navigate) return router.navigate(href)
        return defaultReplace(href)
    }

    const LinkComponent: Link = (props) => {
        if (/^https?:\/\//.test(props.href)) return <DefaultLink {...props} />

        const RouterLink = router?.Link as typeof DefaultLink | undefined
        return RouterLink ? (
            <RouterLink {...props} />
        ) : (
            <DefaultLink {...props} />
        )
    }

    const emailVerification = useMemo(() => {
        const ev = authOverrides.emailVerification
        if (!ev) return undefined
        if (ev === true) return { otp: false }
        return { otp: ev.otp ?? false }
    }, [authOverrides.emailVerification])

    const { data: sessionData } = hooks.useSession()

    const contextValue: AuthUIContextType = {
        authClient,
        avatar,
        basePath: authBasePath,
        baseURL,
        // Auth-specific feature flags — always read from authOverrides, never from the
        // merged blob, so account/org overrides can't silently overwrite them.
        captcha: authOverrides.captcha,
        redirectTo: authOverrides.redirectTo || "/",
        changeEmail: authOverrides.changeEmail ?? true,
        credentials,
        deleteUser,
        freshAge: authOverrides.freshAge ?? 60 * 60 * 24,
        genericOAuth,
        hooks,
        mutators,
        localization,
        nameRequired: authOverrides.nameRequired ?? true,
        organization,
        teams,
        account,
        signUp,
        social,
        toast: renderToast,
        navigate,
        replace,
        viewPaths,
        Link: LinkComponent,
        apiKey: authOverrides.apiKey,
        gravatar: authOverrides.gravatar,
        additionalFields: authOverrides.additionalFields,
        magicLink: authOverrides.magicLink,
        emailOTP: authOverrides.emailOTP,
        passkey: authOverrides.passkey,
        oneTap: authOverrides.oneTap,
        twoFactor: authOverrides.twoFactor,
        multiSession: authOverrides.multiSession,
        emailVerification,
        localizeErrors: authOverrides.localizeErrors ?? true,
        persistClient: authOverrides.persistClient,
        optimistic: authOverrides.optimistic,
        onSessionChange: authOverrides.onSessionChange
    }

    return (
        <AuthUIContext.Provider value={contextValue}>
            {sessionData && organization && <OrganizationRefetcher />}

            {authOverrides.captcha?.provider === "google-recaptcha-v3" ? (
                <RecaptchaV3>{children}</RecaptchaV3>
            ) : (
                children
            )}
        </AuthUIContext.Provider>
    )
}

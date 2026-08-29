import {
    defineClientPlugin,
    type ResolvedClientPluginRuntime
} from "@btst/stack/plugins/client"
import { defineRoute, defineRoutes } from "@btst/yar"
import { lazy } from "react"
import type { AuthViewProps } from "../components/auth/auth-view"
import type { AuthViewPaths } from "../lib/view-paths"
import { authViewPaths } from "../lib/view-paths"
import type { AuthLocalization } from "../localization/auth-localization"
import type { AdditionalFields } from "../types/additional-fields"
import type { AnyAuthClient } from "../types/any-auth-client"
import type { AuthHooks } from "../types/auth-hooks"
import type { AuthMutators } from "../types/auth-mutators"
import type { CaptchaOptions } from "../types/captcha-options"
import type { CredentialsOptions } from "../types/credentials-options"
import type { GenericOAuthOptions } from "../types/generic-oauth-options"
import type { GravatarOptions } from "../types/gravatar-options"
import type { SignUpOptions } from "../types/sign-up-options"
import type { SocialOptions } from "../types/social-options"

/**
 * Per-page customization props for auth views.
 * Passed via AuthPluginOverrides.pageProps.signIn, .signUp, etc.
 */
export type AuthPageProps = Omit<
    AuthViewProps,
    "path" | "pathname" | "view" | "localization"
> & {
    localization?: Partial<AuthLocalization>
}

/**
 * Plugin override interface for auth plugin
 * Defines all configurable options that can be overridden via StackProvider
 */
export interface AuthPluginOverrides {
    /**
     * Better Auth client returned from createAuthClient
     * @default Required
     * @remarks AuthClient
     */
    authClient: AnyAuthClient
    /**
     * Customize the Localization strings
     */
    localization?: AuthLocalization
    /**
     * Default redirect URL after authenticating
     * @default "/"
     */
    redirectTo?: string
    /**
     * Captcha configuration
     */
    captcha?: CaptchaOptions
    /**
     * Credentials configuration
     */
    credentials?: boolean | CredentialsOptions
    /**
     * Sign Up configuration
     */
    signUp?: boolean | SignUpOptions
    /**
     * Social provider configuration
     */
    social?: SocialOptions
    /**
     * Generic OAuth provider configuration
     */
    genericOAuth?: GenericOAuthOptions
    /**
     * Enable or disable Magic Link support
     * @default false
     */
    magicLink?: boolean
    /**
     * Enable or disable Email OTP support
     * @default false
     */
    emailOTP?: boolean
    /**
     * Enable or disable Passkey support
     * @default false
     */
    passkey?: boolean
    /**
     * Enable or disable One Tap support
     * @default false
     */
    oneTap?: boolean
    /**
     * Enable or disable two-factor authentication support
     */
    twoFactor?: ("otp" | "totp")[]
    /**
     * Enable or disable Multi Session support
     * @default false
     */
    multiSession?: boolean
    /**
     * Show Verify Email card for unverified emails
     */
    emailVerification?: boolean | { otp?: boolean }
    /**
     * Localize server-side error messages
     * @default true
     */
    localizeErrors?: boolean
    /**
     * Enable or disable user change email support
     * @default true
     */
    changeEmail?: boolean
    /**
     * Whether the name field should be required
     * @default true
     */
    nameRequired?: boolean
    /**
     * API Key plugin configuration
     */
    apiKey?:
        | {
              /**
               * Prefix for API Keys
               */
              prefix?: string
              /**
               * Metadata for API Keys
               */
              metadata?: Record<string, unknown>
          }
        | boolean
    /**
     * Gravatar configuration
     */
    gravatar?: boolean | GravatarOptions
    /**
     * Additional fields for users
     */
    additionalFields?: AdditionalFields
    /**
     * Freshness age for Session data
     * @default 60 * 60 * 24
     */
    freshAge?: number
    /**
     * Forces better-auth-tanstack to refresh the Session on the auth callback page
     * @default false
     */
    persistClient?: boolean
    /**
     * Perform some User updates optimistically
     * @default false
     */
    optimistic?: boolean
    /**
     * ADVANCED: Custom hooks for fetching auth data
     */
    hooks?: Partial<AuthHooks>
    /**
     * ADVANCED: Custom mutators for updating auth data
     */
    mutators?: Partial<AuthMutators>
    /**
     * Customize the paths for the auth views
     */
    viewPaths?: Partial<AuthViewPaths>
    /**
     * Called when a route error occurs
     */
    onRouteError?: (
        routeName: string,
        error: Error,
        context: { path: string; isSSR: boolean }
    ) => void
    /**
     * Called whenever Better Auth changes the current session.
     */
    onSessionChange?: () => void | Promise<void>
    /**
     * Per-page props (className, classNames, localization, etc.)
     * passed directly to each auth view component.
     */
    pageProps?: {
        signIn?: AuthPageProps
        signUp?: AuthPageProps
        forgotPassword?: AuthPageProps
        resetPassword?: AuthPageProps
        magicLink?: AuthPageProps
        emailOtp?: AuthPageProps
        twoFactor?: AuthPageProps
        recoverAccount?: AuthPageProps
        callback?: Pick<AuthPageProps, "redirectTo">
        signOut?: Pick<AuthPageProps, "redirectTo">
        acceptInvitation?: Pick<AuthPageProps, "className">
        emailVerification?: AuthPageProps
    }
}

// Meta generator factory for auth pages
function createAuthMeta(
    config: ResolvedClientPluginRuntime<"auth">,
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
 * Auth client plugin
 * Provides routes, components, and meta for authentication flows
 *
 * Shared site runtime is inherited from createClientStack.
 */
function createResolvedAuthPlugin(config: ResolvedClientPluginRuntime<"auth">) {
    return {
        routes: () =>
            defineRoutes({
                signIn: defineRoute(`/auth/${authViewPaths.SIGN_IN}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/sign-in-page").then(
                            (m) => ({
                                default: m.SignInPage
                            })
                        )
                    ),
                    meta: createAuthMeta(
                        config,
                        `/auth/${authViewPaths.SIGN_IN}`,
                        "Sign In",
                        "Sign in to your account"
                    )
                }),
                signUp: defineRoute(`/auth/${authViewPaths.SIGN_UP}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/sign-up-page").then(
                            (m) => ({
                                default: m.SignUpPage
                            })
                        )
                    ),
                    meta: createAuthMeta(
                        config,
                        `/auth/${authViewPaths.SIGN_UP}`,
                        "Sign Up",
                        "Create a new account"
                    )
                }),
                forgotPassword: defineRoute(
                    `/auth/${authViewPaths.FORGOT_PASSWORD}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/auth/pages/forgot-password-page"
                            ).then((m) => ({
                                default: m.ForgotPasswordPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/auth/${authViewPaths.FORGOT_PASSWORD}`,
                            "Forgot Password",
                            "Reset your password"
                        )
                    }
                ),
                resetPassword: defineRoute(
                    `/auth/${authViewPaths.RESET_PASSWORD}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/auth/pages/reset-password-page"
                            ).then((m) => ({
                                default: m.ResetPasswordPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/auth/${authViewPaths.RESET_PASSWORD}`,
                            "Reset Password",
                            "Enter your new password"
                        )
                    }
                ),
                magicLink: defineRoute(`/auth/${authViewPaths.MAGIC_LINK}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/magic-link-page").then(
                            (m) => ({
                                default: m.MagicLinkPage
                            })
                        )
                    ),
                    meta: createAuthMeta(
                        config,
                        `/auth/${authViewPaths.MAGIC_LINK}`,
                        "Magic Link",
                        "Sign in with magic link"
                    )
                }),
                emailOtp: defineRoute(`/auth/${authViewPaths.EMAIL_OTP}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/email-otp-page").then(
                            (m) => ({
                                default: m.EmailOtpPage
                            })
                        )
                    ),
                    meta: createAuthMeta(
                        config,
                        `/auth/${authViewPaths.EMAIL_OTP}`,
                        "Email Code",
                        "Sign in with email code"
                    )
                }),
                twoFactor: defineRoute(`/auth/${authViewPaths.TWO_FACTOR}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/two-factor-page").then(
                            (m) => ({
                                default: m.TwoFactorPage
                            })
                        )
                    ),
                    meta: createAuthMeta(
                        config,
                        `/auth/${authViewPaths.TWO_FACTOR}`,
                        "Two-Factor Authentication",
                        "Enter your verification code"
                    )
                }),
                recoverAccount: defineRoute(
                    `/auth/${authViewPaths.RECOVER_ACCOUNT}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/auth/pages/recover-account-page"
                            ).then((m) => ({
                                default: m.RecoverAccountPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/auth/${authViewPaths.RECOVER_ACCOUNT}`,
                            "Recover Account",
                            "Recover your account with a backup code"
                        )
                    }
                ),
                callback: defineRoute(`/auth/${authViewPaths.CALLBACK}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/callback-page").then(
                            (m) => ({
                                default: m.CallbackPage
                            })
                        )
                    )
                }),
                signOut: defineRoute(`/auth/${authViewPaths.SIGN_OUT}`, {
                    page: lazy(() =>
                        import("../components/auth/pages/sign-out-page").then(
                            (m) => ({
                                default: m.SignOutPage
                            })
                        )
                    )
                }),
                acceptInvitation: defineRoute(
                    `/auth/${authViewPaths.ACCEPT_INVITATION}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/auth/pages/accept-invitation-page"
                            ).then((m) => ({
                                default: m.AcceptInvitationPage
                            }))
                        )
                    }
                ),
                emailVerification: defineRoute(
                    `/auth/${authViewPaths.EMAIL_VERIFICATION}`,
                    {
                        page: lazy(() =>
                            import(
                                "../components/auth/pages/email-verification-page"
                            ).then((m) => ({
                                default: m.EmailVerificationPage
                            }))
                        ),
                        meta: createAuthMeta(
                            config,
                            `/auth/${authViewPaths.EMAIL_VERIFICATION}`,
                            "Email Verification",
                            "Verify your email address"
                        )
                    }
                )
            }),
        sitemap: async () => {
            // Only include public-facing auth pages in sitemap
            return [
                {
                    url: `${config.site.baseURL}${config.site.basePath}/auth/${authViewPaths.SIGN_IN}`,
                    lastModified: new Date(),
                    priority: 0.8
                },
                {
                    url: `${config.site.baseURL}${config.site.basePath}/auth/${authViewPaths.SIGN_UP}`,
                    lastModified: new Date(),
                    priority: 0.8
                },
                {
                    url: `${config.site.baseURL}${config.site.basePath}/auth/${authViewPaths.FORGOT_PASSWORD}`,
                    lastModified: new Date(),
                    priority: 0.5
                }
            ]
        }
    }
}

export const authClientPlugin = () =>
    defineClientPlugin<AuthPluginOverrides>()({
        id: "auth",
        resolve: createResolvedAuthPlugin
    })

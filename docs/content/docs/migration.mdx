---
title: Migrate from version 2
description: Breaking provider, component, dependency, and route changes in version 3.
---

Upgrade BTST to 4 and align Better Auth, API key, passkey, and any other Better Auth
plugins to 1.7.6. Upgrade React/React DOM to at least 19.2.6 and Tailwind to at least
4.3.2. This package is now ESM only, matching upstream's core and React packages.

| Version 2 | Version 3 |
| --- | --- |
| `AuthUIProvider` | `AuthProvider` for standalone components, `BetterAuthPluginProvider` inside Stack |
| `AuthView`, `AccountView`, `OrganizationView` | `Auth`, `Settings`, `Organization` |
| `basePath`, `account.basePath` | Standalone `basePaths.auth`, `basePaths.settings`; Stack bridge resolves these from plugin sites |
| `credentials` | `emailAndPassword` |
| `emailVerification: true` | `emailAndPassword: { requireEmailVerification: true }` |
| `social.providers` and `genericOAuth` | `socialProviders` strings or custom provider objects |
| `magicLink`, `emailOTP`, `twoFactor`, `apiKey`, etc. booleans | `plugins: [magicLinkPlugin(), emailOtpPlugin(), twoFactorPlugin(), apiKeyPlugin(), ...]` |
| `overrides.account.account`, `overrides.organization.organization` | Register the corresponding route factories; configure upstream plugins and profile/avatar options in `overrides.auth` |
| `account.fields`, `nameRequired`, avatar configuration | `profile`, `emailAndPassword.name`, `avatar` |
| `UserButton.additionalLinks` | `UserButton.links` |
| Uppercase view and localization keys | Upstream camelCase views and nested localization/locale objects |
| `EmailTemplate` | Named `EmailVerificationEmail`, `ResetPasswordEmail`, `MagicLinkEmail`, etc. from `/server` |
| `/tanstack`, `/instantdb`, `/triplit`, custom `hooks`/`mutators` | Upstream TanStack Query hooks, query factories and server helpers |

Keep using `authClientPlugin()`, `accountClientPlugin()`, and
`organizationClientPlugin()` from `/client`. They now register parameterized route
families so new upstream plugin views and custom segments are reachable. Do not
rely on old individual route keys like `signIn` or `accountSettings` for introspection.

The default account URL changes from `/account/settings` to `/account/account`.
Preserve the existing URL with:

```tsx
const authOverrides = {
  authClient,
  viewPaths: {
    settings: { account: "settings" },
    auth: { verifyEmail: "email-verification" }
  }
}
```

The `auth.verifyEmail` mapping also preserves the old `/auth/email-verification`
URL; the new default is `/auth/verify-email`. Apply the same `viewPaths` to
`overrides.auth` and any standalone `AuthProvider` used by a header `UserButton`
so both generate the same destinations.

If email/password sign-up requires verification, replace the old UI
`emailVerification: true` flag with
`emailAndPassword: { requireEmailVerification: true }`. This tells the sign-up
form to show the verification page after registration. Sign-in separately handles
the server's `EMAIL_NOT_VERIFIED` response, so testing sign-in alone will not
catch a missing sign-up flag. Keep the native Better Auth server's
`emailAndPassword.requireEmailVerification: true` and verification email delivery
configuration: the UI flag controls navigation, while the server enforces access.

Organization members/invitations are now the `people` view. Dynamic roles use the
`roles` view and require the upstream dynamic-access-control option. Page overrides
are keyed by the actual path segment, such as `pageProps["sign-in"]` or
`pageProps["settings"]`, and contain the new component props.

`onSessionChange` remains available in `overrides.auth`. It runs after a settled
native session changes, including sign-in/out or account switching; it does not
run just because configuration rerenders or the initial session loads.

Standalone `AuthProvider` now requires `navigate({ to, replace })`; set `Link` to
your framework's link component. The wrapper owns a fresh fallback QueryClient
per provider when neither an explicit client nor a surrounding provider exists.
SSR applications should pass their request-scoped QueryClient and hydrate it.

See the [upstream 1.7 migration guide](https://better-auth-ui.com/migrations/1-7)
for detailed component and provider configuration.

Auth routes no longer emit guessed sitemap entries. View paths are supplied by the
application's browser provider, so the server-side plugin factory cannot know the
configured URLs. Add public authentication URLs to the application's sitemap if
needed, using the same path configuration. Private settings and administration
pages remain excluded and carry `noindex` metadata.

# Better Auth UI for BTST

`@btst/better-auth-ui` packages Better Auth UI's React/shadcn components as optional
BTST client plugins. Version 3 tracks upstream **1.7.26**, supports **BTST 4**, and
supports the **Better Auth 1.7.6 and 1.7.14** cohorts, **React 19.2.6+**, and **Tailwind 4.3.2+**.

Applications keep ownership of their native Better Auth server/client configuration,
provider credentials, and authorization. BTST supplies routes, framework navigation,
notifications, localization, and a shared request-scoped QueryClient.

See [installation](docs/content/docs/installation.mdx), [optional features](docs/content/docs/features.mdx),
[API reference](docs/content/docs/api.mdx), and the [v3 migration guide](MIGRATION.md).

The auth, account, organization, and admin route families support all upstream
React/shadcn feature plugins, including billing, audit logs, SSO, OAuth client
management and consent, device authorization, phone and wallet sign-in, and agent
authorization. Features remain opt-in.

## Development

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir docs install --frozen-lockfile
pnpm --dir docs check-types
pnpm --dir docs build
```

[SYNC-UPSTREAM.md](SYNC-UPSTREAM.md) records source provenance and the update procedure.

Version 3.0.2 adds compatibility with Stack 5 and the patched Auth 1.7.14 cohort,
while retaining Stack 4/Auth 1.7.6 consumers. New integrations should use Auth,
API-key/passkey, and other selected Auth plugins at 1.7.14 together. Install core
1.7.14, utils 0.5.1, fetch 1.3.3, and better-call 1.4.4 alongside the patched DB
3.0.1 cohort. The published upstream UI dependencies already support Auth 1.7+;
this patch expands the BTST companion's peer contract without changing its forms
or provider API.

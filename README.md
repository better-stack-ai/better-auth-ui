# Better Auth UI for BTST

`@btst/better-auth-ui` packages Better Auth UI's React/shadcn components as optional
BTST client plugins. Version 3 tracks upstream **1.7.26**, supports **BTST 4**, and
aligns with **Better Auth 1.7.6**, **React 19.2.6+**, and **Tailwind 4.3.2+**.

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

# Syncing Better Auth UI

## Pinned source

Version 3.0.0 packages the React/shadcn source at upstream tag `v1.7.26`, commit
`3bb3f04d033fc10c3d825776d9624b01422df98b` in
https://github.com/better-auth-ui/better-auth-ui. `@better-auth-ui/core` and
`@better-auth-ui/react` are exact 1.7.26 runtime dependencies. Better Auth is aligned
to 1.7.6 across the BTST DB, Stack, and UI release cohort.

`upstream-registry.json` records the matching registry inventory. Source is from
`examples/start-shadcn-example/src/components/auth`, `components/ui`, and `lib/auth`.
The two upstream shadcn form/profile regression test files are preserved under
`src/lib/__tests__`, with package-relative imports.

## Update procedure

1. Check out a new branch from the fork's main branch. Fetch the upstream stable
   tag and inspect its release/migration notes, React/core package manifests, and
   registry metadata. Do not merge the upstream monorepo's unrelated examples or
   build toolchain into this packaged companion.
2. Update the exact upstream React/core dependency versions together. Align Better
   Auth peers, dev dependencies, and related optional plugins with the coordinated
   BTST DB release. Update React and Tailwind requirements from upstream.
3. Diff the source directories above against the pinned upstream tag and import
   the changes into the corresponding `src/` directories. Rewrite `@/` imports to
   relative paths. Keep component entry points marked `"use client"`; leave
   `src/client.tsx` and route factory helpers server-safe.
4. Preserve these intentional fork changes when bringing in source:
   - `src/client.tsx`, `src/plugins/*`, and `src/lib/plugin-context-bridge.tsx` provide
     BTST route families, page overrides, metadata, error boundaries, shared
     QueryClient, per-plugin sites, notifications, localization and session refresh.
   - `src/components/auth/auth-provider.tsx` creates a provider-scoped fallback
     QueryClient instead of upstream's module-global fallback. Preserve this SSR
     isolation fix and stable upstream provider configuration.
   - Component toast calls use `useAuthNotifications()` from
     `src/lib/notifications.tsx`; the standalone default is sonner. Each React
     component that uses a toast calls this hook once, and effects include the
     notification method in their dependency lists.
   - `src/lib/error-notifications.ts` deduplicates cache errors across nested
     providers and preserves application cache handlers.
   - `src/lib/auth/localized-tabs.ts` refreshes React tab labels after upstream
     locale and BTST translations resolve; preserve native localization resolvers.
   - `src/lib/utils.ts` uses the existing clsx/tailwind-merge primitives.
   - Package branding, ESM exports, generated plugin subpaths, Tailwind source CSS,
     and dependency placement belong to this fork.
5. Compare every registry item and enabled view/tab with the packaged exports and
   `getEnabledPaths`. New families must mount through the route layer only when
   enabled; plugin adapters and native server permissions remain application-owned.
6. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, plus docs typecheck
   and build. Pack the result and test it with the coordinated Stack/DB tarballs in
   generated consumers and the production application before stable publication.
7. Update the migration documentation and this provenance record. Open a PR and
   verify CI. Use the release workflow after the coordinated integration gate.

The obsolete v2 flat-provider/standalone-hook architecture is intentionally removed;
do not reintroduce compatibility wrappers around replaced upstream behavior.

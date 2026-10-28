# Syncing Better Auth UI

## Pinned source

Version 3.0.2 packages the React/shadcn source at upstream tag `v1.7.32`, commit
`25c6b5e3a8b6b1e35153bd164d0d109b194c4eb3` in
https://github.com/better-auth-ui/better-auth-ui. `@better-auth-ui/core` and
`@better-auth-ui/react` are exact 1.7.32 runtime dependencies. Better Auth is aligned
to the coordinated 1.7.14 BTST DB/Stack cohort; the existing 1.7.6 and Stack 4
consumer profile remains supported. Development tests retain that existing profile
and the coordinated release gate checks Stack 5/Auth 1.7.14.

`upstream-registry.json` records the matching registry inventory. Source is from
`examples/start-shadcn-example/src/components/auth`, `components/ui`, and `lib/auth`.
The upstream shadcn form/profile, recovery-option, sign-up redirect, active-session,
and signed OAuth consent regression tests are preserved under
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
   - `AuthFormRoot` must remain inert until hydration attaches its submit handler,
     and its native method must remain POST. Preserve the SSR/hydration regression
     so slow or unavailable JavaScript cannot submit credentials into URLs.
   - Component toast calls use `useAuthNotifications()` from
     `src/lib/notifications.tsx`; the standalone default is sonner. Each React
     component that uses a toast calls this hook once, and effects include the
     notification method in their dependency lists.
   - `src/lib/error-notifications.ts` deduplicates cache errors across nested
     providers and preserves application cache handlers.
   - `src/lib/auth/localized-tabs.ts` refreshes React tab labels after upstream
     locale and BTST translations resolve; preserve native localization resolvers.
   - Agent approval waits for hydration before reading query parameters, so a
     valid approval URL has the same initial server and client markup.
   - `src/lib/utils.ts` uses the existing clsx/tailwind-merge primitives. Upstream
     `cn` imports are mapped to this helper; the published React runtime still
     receives its required `cn` peer as a dependency.
   - Scrollable permission regions use semantic sections and remain keyboard
     focusable; preserve their accessibility behavior.
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

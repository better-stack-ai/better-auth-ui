export * from "./components/email/email-template"
export type {
    BetterAuthServerProviderOptions,
    BetterAuthStackServer
} from "./lib/better-auth-server-provider"
export {
    createBetterAuthServerProvider,
    createBetterAuthServerProvider as createBetterAuthProvider
} from "./lib/better-auth-server-provider"
export { getViewByPath } from "./lib/utils"
export * from "./lib/view-paths"
export * from "./localization/auth-localization"

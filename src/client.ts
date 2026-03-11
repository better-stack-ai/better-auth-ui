// Re-export plugins and types

export type {
    AccountClientConfig,
    AccountPageProps,
    AccountPluginOverrides
} from "./plugins/account-plugin"
export { accountClientPlugin } from "./plugins/account-plugin"
export type {
    AuthClientConfig,
    AuthPageProps,
    AuthPluginOverrides
} from "./plugins/auth-plugin"
export { authClientPlugin } from "./plugins/auth-plugin"
export type {
    OrganizationClientConfig,
    OrganizationPageProps,
    OrganizationPluginOverrides
} from "./plugins/organization-plugin"
export { organizationClientPlugin } from "./plugins/organization-plugin"

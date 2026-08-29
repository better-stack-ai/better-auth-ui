// Re-export plugins and types
export type {
    AccountPageProps,
    AccountPluginOptions,
    AccountPluginOverrides
} from "./plugins/account-plugin"
export { accountClientPlugin } from "./plugins/account-plugin"
export type {
    AuthPageProps,
    AuthPluginOverrides
} from "./plugins/auth-plugin"
export { authClientPlugin } from "./plugins/auth-plugin"
export type {
    OrganizationPageProps,
    OrganizationPluginOptions,
    OrganizationPluginOverrides
} from "./plugins/organization-plugin"
export { organizationClientPlugin } from "./plugins/organization-plugin"

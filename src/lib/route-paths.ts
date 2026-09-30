import { type AuthConfig, viewPaths } from "@better-auth-ui/core"
import type { organizationPlugin } from "@better-auth-ui/core/plugins/organization"

export type AuthSection = "auth" | "settings" | "organization" | "admin"

/** Only enabled plugin views may mount components or execute their queries. */
export function getEnabledPaths(
    config: AuthConfig,
    section: AuthSection
): string[] {
    const { plugins } = config
    if (section === "organization") {
        const organization = plugins.find(
            (plugin) => plugin.id === "organization"
        ) as ReturnType<typeof organizationPlugin> | undefined
        if (!organization) return []
        return [
            ...Object.entries(organization.viewPaths.organization)
                .filter(
                    ([key]) =>
                        (key !== "teams" || Boolean(organization.teams)) &&
                        (key !== "roles" ||
                            Boolean(organization.dynamicAccessControl?.enabled))
                )
                .map(([, value]) => value),
            ...plugins.flatMap(
                (plugin) =>
                    plugin.organizationTabs?.map((tab) => tab.path) ?? []
            )
        ].filter((path): path is string => typeof path === "string")
    }
    if (section === "admin" && !plugins.some((plugin) => plugin.id === "admin"))
        return []
    const builtInPaths = Object.entries(config.viewPaths[section])
        .filter(([key]) => key in viewPaths[section])
        .map(([, value]) => value)
    const pluginPaths = plugins.flatMap((plugin) => {
        if (section === "settings")
            return (
                plugin.settingsTabs?.map(
                    (tab) => plugin.viewPaths?.settings?.[tab.view]
                ) ?? []
            )
        if (section === "admin")
            return plugin.adminTabs?.map((tab) => tab.path) ?? []
        return Object.keys(plugin.views?.auth ?? {}).map(
            (key) =>
                (
                    plugin.viewPaths?.auth as Record<string, string> | undefined
                )?.[key]
        )
    })
    return [...builtInPaths, ...pluginPaths].filter(
        (path): path is string => typeof path === "string"
    )
}

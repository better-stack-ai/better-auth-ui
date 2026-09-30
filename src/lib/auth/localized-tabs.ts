import type {
    AuthPluginBase,
    AuthPluginLocalizationContext
} from "@better-auth-ui/core"
import type { ReactNode } from "react"
import type { AuthPlugin } from "./auth-plugin"

/** Rebuild rendered tab labels after upstream locale and BTST translations resolve. */
export function withLocalizedTabs<T extends AuthPlugin>(
    plugin: T,
    label: (localization: NoInfer<T["localization"]>) => ReactNode
): T {
    return {
        ...plugin,
        _localizationResolver: (
            resolvedPlugin: AuthPluginBase,
            context: AuthPluginLocalizationContext
        ) => {
            const resolved = (plugin._localizationResolver?.(
                resolvedPlugin,
                context
            ) ?? resolvedPlugin) as T
            return {
                ...resolved,
                ...Object.fromEntries(
                    (
                        [
                            "settingsTabs",
                            "organizationTabs",
                            "adminTabs",
                            "adminUserTabs"
                        ] as const
                    )
                        .filter((key) => resolved[key])
                        .map((key) => [
                            key,
                            resolved[key]?.map((tab) => ({
                                ...tab,
                                label: label(
                                    context.localization as T["localization"]
                                )
                            }))
                        ])
                )
            }
        }
    }
}

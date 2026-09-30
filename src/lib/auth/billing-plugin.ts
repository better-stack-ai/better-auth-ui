import { createAuthPlugin } from "@better-auth-ui/core"
import {
    type BillingPluginOptions,
    billingPlugin as coreBillingPlugin
} from "@better-auth-ui/core/plugins/billing"
import { CreditCard } from "lucide-react"
import { createElement } from "react"
import {
    OrganizationBillingSettings,
    UserBillingSettings
} from "../../components/auth/billing/billing-settings"
import { withLocalizedTabs } from "./localized-tabs"

const billingLabel = (label: string) =>
    createElement(
        "span",
        { className: "flex items-center gap-1" },
        createElement(CreditCard),
        label
    )

export const billingPlugin = createAuthPlugin(
    coreBillingPlugin.id,
    (options: BillingPluginOptions) => {
        const core = coreBillingPlugin(options)
        return withLocalizedTabs(
            {
                ...core,
                ...(core.user
                    ? {
                          settingsTabs: [
                              {
                                  view: "billing" as const,
                                  label: billingLabel(
                                      core.localization.billing
                                  ),
                                  component: UserBillingSettings
                              }
                          ]
                      }
                    : {}),
                ...(core.organization
                    ? {
                          organizationTabs: [
                              {
                                  id: "billing",
                                  path: core.viewPaths.settings.billing,
                                  label: billingLabel(
                                      core.localization.billing
                                  ),
                                  component: OrganizationBillingSettings
                              }
                          ]
                      }
                    : {})
            },
            (localization) => billingLabel(localization.billing)
        )
    }
)

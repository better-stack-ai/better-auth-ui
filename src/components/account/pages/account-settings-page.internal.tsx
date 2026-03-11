"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import { accountViewPaths } from "../../../lib/view-paths"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { AccountPluginOverrides } from "../../../plugins/account-plugin"
import { AccountView } from "../account-view"

export function AccountSettingsPageInternal() {
    const { pageProps } = usePluginOverrides<AccountPluginOverrides>("account")
    const { localization, ...rest } = pageProps?.accountSettings ?? {}

    return (
        <BetterAuthPluginProvider>
            <AccountView
                path={accountViewPaths.SETTINGS}
                {...rest}
                localization={localization as AuthLocalization | undefined}
            />
        </BetterAuthPluginProvider>
    )
}

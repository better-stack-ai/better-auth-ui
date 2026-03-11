"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import { authViewPaths } from "../../../lib/view-paths"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { AuthView } from "../auth-view"

export function TwoFactorPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")
    const { localization, ...rest } = pageProps?.twoFactor ?? {}

    return (
        <BetterAuthPluginProvider>
            <AuthView
                path={authViewPaths.TWO_FACTOR}
                {...rest}
                localization={localization as AuthLocalization | undefined}
            />
        </BetterAuthPluginProvider>
    )
}

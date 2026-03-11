"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import { authViewPaths } from "../../../lib/view-paths"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { AuthView } from "../auth-view"

export function ResetPasswordPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")
    const { localization, ...rest } = pageProps?.resetPassword ?? {}

    return (
        <BetterAuthPluginProvider>
            <AuthView
                path={authViewPaths.RESET_PASSWORD}
                {...rest}
                localization={localization as AuthLocalization | undefined}
            />
        </BetterAuthPluginProvider>
    )
}

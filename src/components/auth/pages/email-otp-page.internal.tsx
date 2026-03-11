"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import { authViewPaths } from "../../../lib/view-paths"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { AuthView } from "../auth-view"

export function EmailOtpPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")
    const { localization, ...rest } = pageProps?.emailOtp ?? {}

    return (
        <BetterAuthPluginProvider>
            <AuthView
                path={authViewPaths.EMAIL_OTP}
                {...rest}
                localization={localization as AuthLocalization | undefined}
            />
        </BetterAuthPluginProvider>
    )
}

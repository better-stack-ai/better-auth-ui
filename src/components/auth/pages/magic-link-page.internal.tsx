"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import { authViewPaths } from "../../../lib/view-paths"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { AuthView } from "../auth-view"

export function MagicLinkPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")
    const { localization, ...rest } = pageProps?.magicLink ?? {}

    return (
        <BetterAuthPluginProvider>
            <AuthView
                path={authViewPaths.MAGIC_LINK}
                {...rest}
                localization={localization as AuthLocalization | undefined}
            />
        </BetterAuthPluginProvider>
    )
}

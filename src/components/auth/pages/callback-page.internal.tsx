"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { AuthCallback } from "../auth-callback"

export function CallbackPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")

    return (
        <BetterAuthPluginProvider>
            <AuthCallback redirectTo={pageProps?.callback?.redirectTo} />
        </BetterAuthPluginProvider>
    )
}

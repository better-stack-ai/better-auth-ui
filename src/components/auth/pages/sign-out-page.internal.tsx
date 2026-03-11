"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { SignOut } from "../sign-out"

export function SignOutPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")

    return (
        <BetterAuthPluginProvider>
            <SignOut redirectTo={pageProps?.signOut?.redirectTo} />
        </BetterAuthPluginProvider>
    )
}

"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import type { AuthPluginOverrides } from "../../../plugins/auth-plugin"
import { AcceptInvitationCard } from "../../organization/accept-invitation-card"

export function AcceptInvitationPageInternal() {
    const { pageProps } = usePluginOverrides<AuthPluginOverrides>("auth")

    return (
        <BetterAuthPluginProvider>
            <AcceptInvitationCard
                className={pageProps?.acceptInvitation?.className}
            />
        </BetterAuthPluginProvider>
    )
}

"use client"

import { usePluginOverrides } from "@btst/stack/context"
import { BetterAuthPluginProvider } from "../../../lib/plugin-context-bridge"
import { organizationViewPaths } from "../../../lib/view-paths"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { OrganizationPluginOverrides } from "../../../plugins/organization-plugin"
import { OrganizationView } from "../organization-view"

export function OrganizationMembersPageInternal() {
    const { pageProps } =
        usePluginOverrides<OrganizationPluginOverrides>("organization")
    const { localization, ...rest } = pageProps?.organizationMembers ?? {}

    return (
        <BetterAuthPluginProvider>
            <OrganizationView
                path={organizationViewPaths.MEMBERS}
                {...rest}
                localization={localization as AuthLocalization | undefined}
            />
        </BetterAuthPluginProvider>
    )
}

"use client"

import { useAuthPlugin } from "@better-auth-ui/react"
import { MailWarning, Send } from "lucide-react"
import { organizationPlugin } from "../../../lib/auth/organization-plugin"
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle
} from "../../ui/empty"

/**
 * Empty state for `UserInvitations`.
 */
export function UserInvitationsEmpty({
    verificationRequired = false
}: {
    verificationRequired?: boolean
}) {
    const { localization: organizationLocalization } =
        useAuthPlugin(organizationPlugin)

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    {verificationRequired ? <MailWarning /> : <Send />}
                </EmptyMedia>
                <EmptyTitle>
                    {verificationRequired
                        ? organizationLocalization.verifyEmailToViewInvitations
                        : organizationLocalization.noInvitations}
                </EmptyTitle>
                <EmptyDescription>
                    {verificationRequired
                        ? organizationLocalization.verifyEmailToViewInvitationsDescription
                        : organizationLocalization.userInvitationsEmptyDescription}
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

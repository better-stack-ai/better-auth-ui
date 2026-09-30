"use client"

import {
    authMutationKeys,
    authQueryKeys,
    getAuthErrorCode,
    getAuthErrorMessage,
    getAuthErrorPresentation,
    isPasswordCompromisedError
} from "@better-auth-ui/core"
import { oneTapMutationKeys } from "@better-auth-ui/core/plugins/one-tap"
import { useAuth } from "@better-auth-ui/react"
import {
    matchMutation,
    matchQuery,
    useQueryClient
} from "@tanstack/react-query"
import { useContext, useEffect } from "react"
import { registerErrorNotifications } from "../../lib/error-notifications"
import {
    AuthNotificationsContext,
    useAuthNotifications
} from "../../lib/notifications"

export function ErrorToaster() {
    const toast = useAuthNotifications()
    const customNotifications = useContext(AuthNotificationsContext)
    const { localization } = useAuth()
    const queryClient = useQueryClient()

    useEffect(() => {
        return registerErrorNotifications(queryClient, {
            priority: customNotifications ? 1 : 0,
            query: (error, query) => {
                if (!matchQuery({ queryKey: authQueryKeys.all }, query)) return
                if (getAuthErrorPresentation(query.meta) !== "toast") return

                if (getAuthErrorCode(error) === "EMAIL_NOT_VERIFIED") return
                const message = getAuthErrorMessage(error, localization)
                if (message) {
                    console.error("[Better Auth UI]", error)
                    toast.error(message)
                }
            },
            mutation: (error, variables, onMutateResult, mutation, context) => {
                if (
                    !matchMutation(
                        { mutationKey: authMutationKeys.all },
                        mutation
                    )
                ) {
                    return
                }
                if (getAuthErrorPresentation(mutation.meta) !== "toast") return
                // Every form that sets a new password renders this one against the
                // password field, so a toast would just repeat it.
                if (isPasswordCompromisedError(error)) return

                if (
                    getAuthErrorCode(error) === "EMAIL_NOT_VERIFIED" &&
                    !matchMutation(
                        { mutationKey: oneTapMutationKeys.prompt },
                        mutation
                    )
                ) {
                    return
                }
                const message = getAuthErrorMessage(
                    error,
                    localization,
                    mutation.options.mutationKey
                )
                if (message) {
                    console.error("[Better Auth UI]", error)
                    toast.error(message)
                }
            }
        })
    }, [queryClient, localization, toast.error, customNotifications])

    return null
}

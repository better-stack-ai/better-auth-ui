"use client"

import { createContext, useContext } from "react"
import { toast } from "sonner"

export type AuthNotifications = {
    success: (message: string) => unknown
    error: (message: string) => unknown
}

export const AuthNotificationsContext = createContext<AuthNotifications | null>(
    null
)
export const useAuthNotifications = (): AuthNotifications =>
    useContext(AuthNotificationsContext) ?? toast

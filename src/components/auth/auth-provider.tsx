"use client"

import {
    AuthProvider as AuthProviderPrimitive,
    type AuthProviderProps
} from "@better-auth-ui/react"
import { QueryClient, QueryClientContext } from "@tanstack/react-query"
import type {
    ComponentPropsWithoutRef,
    ComponentType,
    PropsWithChildren,
    ReactNode
} from "react"
import { useContext, useState } from "react"

import { ErrorToaster } from "./error-toaster"

declare module "@better-auth-ui/core" {
    interface AuthConfig {
        /**
         * React component used to render internal navigation links.
         * Typically TanStack Router's `Link` or Next.js's `Link`.
         */
        Link: ComponentType<
            PropsWithChildren<
                { className?: string; href: string; to?: string } & Pick<
                    ComponentPropsWithoutRef<"a">,
                    "aria-disabled" | "tabIndex" | "onClick"
                >
            >
        >
    }

    /** Widen `AdditionalField.label` to `ReactNode` in the shadcn package. */
    interface AdditionalFieldRegister {
        label: ReactNode
    }
}

/**
 * Provides an authentication context by rendering an auth provider with the sonner toast handler injected, forwarding remaining configuration and rendering `children` inside it.
 *
 * @param children - React nodes to render inside the authentication provider
 * @returns A React element that renders an authentication provider configured with the provided props and toast handler
 */
export function AuthProvider({
    children,
    queryClient,
    ...config
}: AuthProviderProps) {
    const contextClient = useContext(QueryClientContext)
    const [fallbackClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: { queries: { staleTime: 5000 } }
            })
    )
    return (
        <AuthProviderPrimitive
            {...config}
            queryClient={queryClient ?? contextClient ?? fallbackClient}
        >
            {children}

            <ErrorToaster />
        </AuthProviderPrimitive>
    )
}

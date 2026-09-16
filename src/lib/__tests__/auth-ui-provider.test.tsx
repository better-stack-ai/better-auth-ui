import { act, render } from "@testing-library/react"
import { useContext, useEffect, useSyncExternalStore } from "react"
import { describe, expect, it, vi } from "vitest"
import type { AnyAuthClient } from "../../types/any-auth-client"
import {
    AuthUIContext,
    type AuthUIContextType,
    AuthUIProvider
} from "../auth-ui-provider"

vi.mock("../organization-refetcher", () => ({
    OrganizationRefetcher: () => <div data-testid="organization-refetcher" />
}))

describe("AuthUIProvider with Better Auth 1.6", () => {
    it("keeps configuration stable while session consumers update", () => {
        let snapshot = { data: null, isPending: true }
        const listeners = new Set<() => void>()
        const subscribe = (listener: () => void) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        }
        const authClient = {
            useSession: () => useSyncExternalStore(subscribe, () => snapshot)
        } as unknown as AnyAuthClient
        const configurations: AuthUIContextType[] = []
        let pending = true

        function SessionConsumer() {
            const context = useContext(AuthUIContext)
            pending = context.hooks.useSession().isPending
            useEffect(() => {
                configurations.push(context)
            }, [context])
            return null
        }

        render(
            <AuthUIProvider authClient={authClient}>
                <SessionConsumer />
            </AuthUIProvider>
        )
        expect(pending).toBe(true)
        act(() => {
            snapshot = { data: null, isPending: false }
            for (const listener of listeners) listener()
        })
        expect(pending).toBe(false)
        expect(configurations).toHaveLength(1)
    })

    it("mounts organization refetching only while a session exists", () => {
        let session: { user: { id: string } } | null = null
        const listeners = new Set<() => void>()
        const subscribe = (listener: () => void) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        }
        const authClient = {
            useSession: () => ({
                data: useSyncExternalStore(subscribe, () => session)
            })
        } as unknown as AnyAuthClient
        const view = render(
            <AuthUIProvider authClient={authClient} organization>
                <div />
            </AuthUIProvider>
        )
        expect(view.queryByTestId("organization-refetcher")).toBeNull()
        act(() => {
            session = { user: { id: "user" } }
            for (const listener of listeners) listener()
        })
        expect(view.queryByTestId("organization-refetcher")).not.toBeNull()
        act(() => {
            session = null
            for (const listener of listeners) listener()
        })
        expect(view.queryByTestId("organization-refetcher")).toBeNull()
    })

    it("forwards the required provider when unlinking an account", async () => {
        const unlinkAccount = vi.fn()
        const authClient = {
            unlinkAccount,
            useSession: vi.fn(() => ({ data: null, isPending: false }))
        } as unknown as AnyAuthClient
        let context!: AuthUIContextType

        function ContextCapture() {
            context = useContext(AuthUIContext)
            return null
        }

        render(
            <AuthUIProvider authClient={authClient}>
                <ContextCapture />
            </AuthUIProvider>
        )

        await context.mutators.unlinkAccount({
            accountId: "github-account",
            providerId: "github"
        })

        expect(unlinkAccount).toHaveBeenCalledWith({
            accountId: "github-account",
            providerId: "github",
            fetchOptions: { throw: true }
        })
    })
})

import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
    AuthUIContext,
    type AuthUIContextType
} from "../../../lib/auth-ui-provider"
import { authViewPaths } from "../../../lib/view-paths"
import { SignOut } from "../sign-out"

describe("SignOut", () => {
    it("refreshes the session bridge before navigating after logout", async () => {
        const signOut = vi.fn(() => Promise.resolve())
        const refetch = vi.fn(() => Promise.resolve())
        const onSessionChange = vi.fn(() => Promise.resolve())
        const navigate = vi.fn()
        const context = {
            authClient: { signOut },
            basePath: "/auth",
            hooks: {
                useSession: () => ({ refetch })
            },
            navigate,
            onSessionChange,
            redirectTo: "/",
            viewPaths: authViewPaths
        } as unknown as AuthUIContextType

        render(
            <AuthUIContext.Provider value={context}>
                <SignOut />
            </AuthUIContext.Provider>
        )

        await waitFor(() => expect(navigate).toHaveBeenCalledOnce())

        expect(signOut).toHaveBeenCalledOnce()
        expect(refetch).toHaveBeenCalledOnce()
        expect(onSessionChange).toHaveBeenCalledOnce()
        expect(navigate).toHaveBeenCalledWith("/auth/sign-in")
        expect(refetch.mock.invocationCallOrder[0]).toBeLessThan(
            onSessionChange.mock.invocationCallOrder[0] ?? 0
        )
        expect(onSessionChange.mock.invocationCallOrder[0]).toBeLessThan(
            navigate.mock.invocationCallOrder[0] ?? 0
        )
    })
})

import { render } from "@testing-library/react"
import { useContext } from "react"
import { describe, expect, it, vi } from "vitest"
import type { AnyAuthClient } from "../../types/any-auth-client"
import {
    AuthUIContext,
    type AuthUIContextType,
    AuthUIProvider
} from "../auth-ui-provider"

describe("AuthUIProvider with Better Auth 1.6", () => {
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

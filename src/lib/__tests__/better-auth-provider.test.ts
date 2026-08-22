import { describe, expect, it, vi } from "vitest"
import { createBetterAuthProvider } from "../better-auth-provider"
import { createBetterAuthServerProvider } from "../better-auth-server-provider"

describe("createBetterAuthProvider", () => {
    it("maps the Better Auth session user to a stack identity", async () => {
        const getSession = vi.fn().mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                    name: "Ada",
                    email: "ada@example.com",
                    image: null,
                    role: "admin"
                }
            }
        })

        const provider = createBetterAuthProvider({ getSession })

        await expect(provider.getIdentity()).resolves.toEqual({
            id: "user-1",
            name: "Ada",
            email: "ada@example.com",
            role: "admin"
        })
        expect(provider.loginPath).toBe("/auth/sign-in")
    })

    it("returns null for an unauthenticated session", async () => {
        const provider = createBetterAuthProvider({
            getSession: vi.fn().mockResolvedValue({ data: null })
        })

        await expect(provider.getIdentity()).resolves.toBeNull()
    })

    it("leaves permissions to Better Auth unless a mapping is configured", () => {
        const provider = createBetterAuthProvider({
            getSession: vi.fn().mockResolvedValue({ data: null })
        })

        expect(provider.can).toBeUndefined()
    })

    it("maps checks to the Better Auth organization permission endpoint", async () => {
        const hasPermission = vi.fn().mockResolvedValue({
            data: { success: true }
        })
        const provider = createBetterAuthProvider(
            {
                getSession: vi.fn().mockResolvedValue({ data: null }),
                organization: { hasPermission }
            },
            { permissionProvider: "organization" }
        )

        await expect(
            provider.can?.({
                resource: "post",
                action: "update",
                params: { organizationId: "org-1" },
                identity: { id: "user-1" }
            })
        ).resolves.toBe(true)
        expect(hasPermission).toHaveBeenCalledWith({
            organizationId: "org-1",
            permissions: { post: ["update"] }
        })
    })

    it("maps checks to the Better Auth admin permission endpoint", async () => {
        const hasPermission = vi.fn().mockResolvedValue({ success: false })
        const provider = createBetterAuthProvider(
            {
                getSession: vi.fn().mockResolvedValue({ data: null }),
                admin: { hasPermission }
            },
            { loginPath: "/login", permissionProvider: "admin" }
        )

        await expect(
            provider.can?.({
                resource: "user",
                action: "ban",
                params: { organizationId: "ignored-for-admin" },
                identity: { id: "user-1" }
            })
        ).resolves.toBe(false)
        expect(hasPermission).toHaveBeenCalledWith({
            permissions: { user: ["ban"] }
        })
        expect(provider.loginPath).toBe("/login")
    })
})

describe("createBetterAuthServerProvider", () => {
    it("omits server authorization when no mapping is configured", () => {
        const provider = createBetterAuthServerProvider({
            api: { getSession: vi.fn().mockResolvedValue(null) }
        })

        expect(provider.can).toBeUndefined()
    })

    it("resolves a request identity from headers once per request", async () => {
        const getSession = vi.fn().mockResolvedValue({
            user: {
                id: "user-1",
                name: "Ada",
                image: "https://example.com/ada.png"
            }
        })
        const provider = createBetterAuthServerProvider({
            api: { getSession }
        })
        const request = new Request("https://example.com/api/data", {
            headers: { cookie: "session=token" }
        })

        const first = provider.getIdentity({
            headers: request.headers,
            request
        })
        const second = provider.getIdentity({
            headers: request.headers,
            request
        })

        await expect(first).resolves.toEqual({
            id: "user-1",
            name: "Ada",
            image: "https://example.com/ada.png"
        })
        await expect(second).resolves.toEqual({
            id: "user-1",
            name: "Ada",
            image: "https://example.com/ada.png"
        })
        expect(getSession).toHaveBeenCalledTimes(1)
        expect(getSession).toHaveBeenCalledWith({ headers: request.headers })
    })

    it("maps server checks to Better Auth organization permissions", async () => {
        const hasPermission = vi.fn().mockResolvedValue({ success: true })
        const provider = createBetterAuthServerProvider(
            {
                api: {
                    getSession: vi.fn().mockResolvedValue(null),
                    hasPermission
                }
            },
            { permissionProvider: "organization" }
        )
        const headers = new Headers({ cookie: "session=token" })

        await expect(
            provider.can?.({
                resource: "member",
                action: "delete",
                params: { organizationId: "org-1" },
                identity: { id: "user-1" },
                headers
            })
        ).resolves.toBe(true)
        expect(hasPermission).toHaveBeenCalledWith({
            headers,
            body: {
                organizationId: "org-1",
                permissions: { member: ["delete"] }
            }
        })
    })
})

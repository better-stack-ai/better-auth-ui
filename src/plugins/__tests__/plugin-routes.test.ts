import { createClientStack } from "@btst/stack/client"
import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { accountClientPlugin } from "../account-plugin"
import { authClientPlugin } from "../auth-plugin"
import { organizationClientPlugin } from "../organization-plugin"

interface DeclarativeRoute {
    def?: {
        page?: unknown
    }
    (): {
        PageComponent?: unknown
    }
}

const createStack = (includeOrganization = true) =>
    createClientStack({
        api: {
            baseURL: "https://example.com",
            basePath: "/api/data"
        },
        site: {
            baseURL: "https://example.com",
            basePath: "/pages"
        },
        queryClient: new QueryClient() as never,
        plugins: {
            auth: authClientPlugin(),
            account: accountClientPlugin(),
            ...(includeOrganization
                ? { organization: organizationClientPlugin() }
                : {})
        }
    })

describe("BTST v3 client plugin routes", () => {
    it("resolves every page definition against the shared stack runtime", () => {
        const stack = createStack()

        for (const plugin of Object.values(stack.context.plugins)) {
            const routes = Object.values(
                plugin.routes(stack.context)
            ) as DeclarativeRoute[]

            expect(routes.length).toBeGreaterThan(0)

            for (const route of routes) {
                expect(route.def?.page).toBeDefined()
                expect(route().PageComponent).toBeDefined()
            }
        }
    })

    it("supports auth and account without the organization plugin", () => {
        const stack = createStack(false)

        expect(Object.keys(stack.context.plugins)).toEqual(["auth", "account"])
    })

    it("uses the resolved site runtime for sitemap URLs", async () => {
        const stack = createStack(false)
        const sitemap = await stack.generateSitemap()

        expect(sitemap).not.toHaveLength(0)
        expect(
            sitemap.every(({ url }) =>
                url.startsWith("https://example.com/pages/auth/")
            )
        ).toBe(true)
    })
})

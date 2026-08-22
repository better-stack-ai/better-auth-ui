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

const config = {
    siteBaseURL: "https://example.com",
    siteBasePath: "/app"
}

describe("BTST v3 client plugin routes", () => {
    it.each([
        ["auth", authClientPlugin(config)],
        ["account", accountClientPlugin(config)],
        ["organization", organizationClientPlugin(config)]
    ])("registers every %s page as a declarative route", (_, plugin) => {
        const routes = Object.values(plugin.routes()) as DeclarativeRoute[]

        expect(routes.length).toBeGreaterThan(0)

        for (const route of routes) {
            expect(route.def?.page).toBeDefined()
            expect(route().PageComponent).toBeDefined()
        }
    })
})

import { createClientStack } from "@btst/stack/client"
import { StackProvider } from "@btst/stack/context"
import { QueryClient } from "@tanstack/react-query"
import type { AnyAuthClient } from "../../types/any-auth-client"
import {
    type AccountPluginOverrides,
    accountClientPlugin
} from "../account-plugin"
import { type AuthPluginOverrides, authClientPlugin } from "../auth-plugin"
import {
    type OrganizationPluginOverrides,
    organizationClientPlugin
} from "../organization-plugin"

const authClient = null as unknown as AnyAuthClient

const stack = createClientStack({
    api: {
        baseURL: "https://example.com",
        basePath: "/api/data",
        headers: { authorization: "Bearer server-only" }
    },
    site: {
        baseURL: "https://example.com",
        basePath: "/pages"
    },
    queryClient: new QueryClient() as never,
    plugins: {
        auth: authClientPlugin(),
        account: accountClientPlugin(),
        organization: organizationClientPlugin()
    }
})

// @ts-expect-error Request headers are not exposed through the browser provider runtime.
stack.provider.api.headers

;<StackProvider
    stack={stack}
    overrides={{
        auth: {
            authClient,
            credentials: true,
            onSessionChange: async () => undefined,
            pageProps: {
                signIn: { redirectTo: "/pages/account/settings" }
            }
        },
        account: {
            account: true,
            avatar: {
                extension: "png",
                size: 128
            },
            pageProps: {
                accountSettings: { className: "account-settings" }
            }
        },
        organization: {
            organization: true,
            pageProps: {
                organizationMembers: { className: "organization-members" }
            }
        }
    }}
/>

;<StackProvider
    stack={stack}
    overrides={{
        account: {
            // @ts-expect-error StackProvider infers account overrides from the stack.
            authClient
        }
    }}
/>

const invalidAuth: AuthPluginOverrides = {
    authClient,
    // @ts-expect-error Avatar configuration belongs to account overrides.
    avatar: true
}

const invalidAccountAuthClient: AccountPluginOverrides = {
    // @ts-expect-error The Better Auth client is configured once under auth.
    authClient
}

const invalidAccountCredentials: AccountPluginOverrides = {
    // @ts-expect-error Auth-only credentials are rejected under account.
    credentials: true
}

const invalidAccountBasePath: AccountPluginOverrides = {
    // @ts-expect-error Route base paths come from the resolved client stack.
    basePath: "/account"
}

const invalidNestedAccountBasePath: AccountPluginOverrides = {
    account: {
        // @ts-expect-error Nested route base paths are also stack-owned.
        basePath: "/account"
    }
}

const invalidAccountPage: AccountPluginOverrides = {
    pageProps: {
        // @ts-expect-error Auth page props are rejected under account.
        signIn: {}
    }
}

const invalidOrganizationAuthClient: OrganizationPluginOverrides = {
    // @ts-expect-error The Better Auth client is configured once under auth.
    authClient
}

const invalidOrganizationHooks: OrganizationPluginOverrides = {
    // @ts-expect-error Auth hooks are rejected under organization.
    hooks: {}
}

const invalidOrganizationBasePath: OrganizationPluginOverrides = {
    // @ts-expect-error Route base paths come from the resolved client stack.
    basePath: "/organization"
}

const invalidNestedOrganizationBasePath: OrganizationPluginOverrides = {
    organization: {
        // @ts-expect-error Nested route base paths are also stack-owned.
        basePath: "/organization"
    }
}

const invalidOrganizationPage: OrganizationPluginOverrides = {
    pageProps: {
        // @ts-expect-error Account page props are rejected under organization.
        accountSettings: {}
    }
}

// @ts-expect-error Shared site runtime belongs to createClientStack.
authClientPlugin({
    siteBaseURL: "https://example.com",
    siteBasePath: "/pages"
})

void invalidAuth
void invalidAccountAuthClient
void invalidAccountCredentials
void invalidAccountBasePath
void invalidNestedAccountBasePath
void invalidAccountPage
void invalidOrganizationAuthClient
void invalidOrganizationHooks
void invalidOrganizationBasePath
void invalidNestedOrganizationBasePath
void invalidOrganizationPage

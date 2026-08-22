import type { StackServerAuthProvider } from "@btst/stack/api"
import {
    type BetterAuthPermissionProvider,
    type BetterAuthPermissionResult,
    type BetterAuthUser,
    getPermissionBody,
    getPermissionDecision,
    toStackIdentity
} from "./better-auth-provider-shared"

type MaybePromise<T> = Promise<T> | T

type BetterAuthServerSession =
    | { data?: { user: BetterAuthUser } | null }
    | { user: BetterAuthUser }
    | null

interface BetterAuthServerApi {
    getSession: (input: {
        headers: Headers
    }) => MaybePromise<BetterAuthServerSession>
    hasPermission?: (input: {
        headers: Headers
        body: ReturnType<typeof getPermissionBody>
    }) => MaybePromise<BetterAuthPermissionResult>
    userHasPermission?: (input: {
        headers: Headers
        body: ReturnType<typeof getPermissionBody>
    }) => MaybePromise<BetterAuthPermissionResult>
}

export interface BetterAuthStackServer {
    api: BetterAuthServerApi
}

export interface BetterAuthServerProviderOptions {
    /** Better Auth permission plugin used by server-side BTST checks. */
    permissionProvider?: BetterAuthPermissionProvider
    /** Override the default Better Auth permission mapping. */
    can?: NonNullable<StackServerAuthProvider["can"]>
}

function getSessionUser(
    session: BetterAuthServerSession
): BetterAuthUser | null {
    if (!session) return null
    if ("user" in session) return session.user
    return session.data?.user ?? null
}

/**
 * Adapt a Better Auth server instance to the auth contract consumed by stack().
 */
export function createBetterAuthServerProvider(
    auth: BetterAuthStackServer,
    options: BetterAuthServerProviderOptions = {}
): StackServerAuthProvider {
    const identities = new WeakMap<
        Request,
        Promise<ReturnType<typeof toStackIdentity>>
    >()
    const permissionProvider = options.permissionProvider
    const can =
        options.can ??
        (permissionProvider
            ? async (
                  params: Parameters<
                      NonNullable<StackServerAuthProvider["can"]>
                  >[0]
              ) => {
                  if (!params.identity) return false

                  const permissionMethod =
                      permissionProvider === "organization"
                          ? auth.api.hasPermission
                          : auth.api.userHasPermission
                  if (!permissionMethod) return false

                  const result = await permissionMethod({
                      headers: params.headers,
                      body: getPermissionBody(
                          params,
                          permissionProvider === "organization"
                      )
                  })
                  return getPermissionDecision(result)
              }
            : undefined)

    return {
        getIdentity: ({ headers, request }) => {
            let identity = identities.get(request)

            if (!identity) {
                identity = Promise.resolve(
                    auth.api.getSession({ headers })
                ).then((session) => toStackIdentity(getSessionUser(session)))
                identities.set(request, identity)
            }
            return identity
        },
        ...(can ? { can } : {})
    }
}

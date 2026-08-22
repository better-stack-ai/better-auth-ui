import type { StackAuthProvider } from "@btst/stack/context"
import {
    type BetterAuthPermissionProvider,
    type BetterAuthPermissionResult,
    type BetterAuthUser,
    getPermissionBody,
    getPermissionDecision,
    toStackIdentity
} from "./better-auth-provider-shared"

type MaybePromise<T> = Promise<T> | T

interface BetterAuthClientSessionResult {
    data?: { user: BetterAuthUser } | null
}

interface BetterAuthClientPermissionApi {
    hasPermission: (
        input: ReturnType<typeof getPermissionBody>
    ) => MaybePromise<BetterAuthPermissionResult>
}

export interface BetterAuthStackClient {
    getSession: () => MaybePromise<BetterAuthClientSessionResult>
    admin?: BetterAuthClientPermissionApi
    organization?: BetterAuthClientPermissionApi
}

export interface BetterAuthProviderOptions {
    /** Path used by BTST when an unauthenticated user reaches a gated route. */
    loginPath?: string
    /**
     * Better Auth permission plugin to use for BTST resource/action checks.
     * Leave unset when the client has no permission plugin configured.
     */
    permissionProvider?: BetterAuthPermissionProvider
    /** Override the default Better Auth permission mapping. */
    can?: NonNullable<StackAuthProvider["can"]>
}

/**
 * Adapt a Better Auth client to the auth contract consumed by StackProvider.
 */
export function createBetterAuthProvider(
    authClient: BetterAuthStackClient,
    options: BetterAuthProviderOptions = {}
): StackAuthProvider {
    const permissionProvider = options.permissionProvider
    const can =
        options.can ??
        (permissionProvider
            ? async (
                  params: Parameters<NonNullable<StackAuthProvider["can"]>>[0]
              ) => {
                  if (!params.identity) return false

                  const permissionApi = authClient[permissionProvider]
                  if (!permissionApi?.hasPermission) return false

                  const result = await permissionApi.hasPermission(
                      getPermissionBody(
                          params,
                          permissionProvider === "organization"
                      )
                  )
                  return getPermissionDecision(result)
              }
            : undefined)

    return {
        getIdentity: async () => {
            const session = await authClient.getSession()
            return toStackIdentity(session.data?.user)
        },
        ...(can ? { can } : {}),
        loginPath: options.loginPath ?? "/auth/sign-in"
    }
}

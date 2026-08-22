import type { CanParams, StackIdentity } from "@btst/stack/context"

export type BetterAuthPermissionProvider = "admin" | "organization"

export interface BetterAuthUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    [key: string]: unknown
}

export type BetterAuthPermissionResult =
    | boolean
    | {
          data?: { success?: boolean } | null
          success?: boolean
      }

export function toStackIdentity(
    user: BetterAuthUser | null | undefined
): StackIdentity | null {
    if (!user) return null

    const { id, name, email, image, ...fields } = user

    return {
        ...fields,
        id,
        ...(typeof name === "string" ? { name } : {}),
        ...(typeof email === "string" ? { email } : {}),
        ...(typeof image === "string" ? { image } : {})
    }
}

export function getPermissionBody(
    { resource, action, params }: CanParams,
    includeOrganizationId = true
): {
    organizationId?: string
    permissions: Record<string, string[]>
} {
    const organizationId = params?.organizationId

    return {
        ...(includeOrganizationId && typeof organizationId === "string"
            ? { organizationId }
            : {}),
        permissions: { [resource]: [action] }
    }
}

export function getPermissionDecision(
    result: BetterAuthPermissionResult
): boolean {
    if (typeof result === "boolean") return result
    return result.data?.success ?? result.success ?? false
}

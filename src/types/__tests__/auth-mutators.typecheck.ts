import type { AuthMutators } from "../auth-mutators"

type UnlinkAccountParams = Parameters<AuthMutators["unlinkAccount"]>[0]

const validUnlink: UnlinkAccountParams = {
    accountId: "github-account",
    providerId: "github"
}

// @ts-expect-error Better Auth 1.6 requires the provider ID when unlinking.
const missingProvider: UnlinkAccountParams = { accountId: "github-account" }

void validUnlink
void missingProvider

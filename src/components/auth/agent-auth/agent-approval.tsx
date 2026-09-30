"use client"

import type {
    AgentApprovalRequest,
    AgentAuthClient,
    AgentCapabilityGrant
} from "@better-auth-ui/core/plugins/agent-auth"
import { useAuth, useAuthPlugin, useSession } from "@better-auth-ui/react"
import {
    useAgentApproval,
    useApproveAgent,
    useDenyAgent
} from "@better-auth-ui/react/plugins/agent-auth"
import {
    BotIcon,
    CheckIcon,
    CircleCheckIcon,
    CircleXIcon,
    FingerprintIcon
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { agentAuthPlugin } from "../../../lib/auth/agent-auth-plugin"
import { cn } from "../../../lib/utils"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "../../ui/card"
import { Checkbox } from "../../ui/checkbox"
import { Skeleton } from "../../ui/skeleton"
import { Spinner } from "../../ui/spinner"

type ApprovalResult = "approved" | "denied"

const strengthVariant = (strength: AgentCapabilityGrant["approvalStrength"]) =>
    strength === "webauthn" ? "outline" : "secondary"

export type AgentApprovalProps = { className?: string }

/** Render the Agent Auth approval page configured by `deviceAuthorizationPage`. */
export function AgentApproval({ className }: AgentApprovalProps) {
    const { authClient, basePaths, navigate, viewPaths } =
        useAuth<AgentAuthClient>()
    const plugin = useAuthPlugin(agentAuthPlugin)
    const session = useSession(authClient)
    const request = useMemo<AgentApprovalRequest | undefined>(() => {
        if (typeof window === "undefined") return undefined
        const query = new URLSearchParams(window.location.search)
        const agentId = query.get("agent_id")
        if (!agentId) return undefined
        return {
            agentId,
            approvalId: query.get("approval_id") ?? undefined,
            userCode: query.get("code") ?? query.get("user_code") ?? undefined
        }
    }, [])
    const approval = useAgentApproval(authClient, plugin.adapter, request)
    const approve = useApproveAgent(authClient, plugin.adapter)
    const deny = useDenyAgent(authClient, plugin.adapter)
    const [selection, setSelection] = useState<Set<string> | null>(null)
    const [result, setResult] = useState<ApprovalResult>()

    useEffect(() => {
        if (
            session.isPending ||
            session.data ||
            typeof window === "undefined"
        ) {
            return
        }
        const returnPath = `${window.location.pathname}${window.location.search}`
        navigate({
            to: `${basePaths.auth}/${viewPaths.auth.signIn}?redirectTo=${encodeURIComponent(returnPath)}`
        })
    }, [
        basePaths.auth,
        navigate,
        session.data,
        session.isPending,
        viewPaths.auth.signIn
    ])

    const requested = approval.data?.requestedCapabilities ?? []
    const selected =
        selection ?? new Set(requested.map((grant) => grant.capability))
    const updateSelection = (capability: string, isSelected: boolean) => {
        const next = new Set(selected)
        if (isSelected) next.add(capability)
        else next.delete(capability)
        setSelection(next)
    }
    const decision = {
        ...request,
        agentId: request?.agentId ?? "",
        capabilities: [...selected]
    }
    const denyDecision = {
        ...request,
        agentId: request?.agentId ?? ""
    }

    if (!request) {
        return (
            <Card className={cn("w-full max-w-md", className)}>
                <CardContent className="text-destructive text-sm">
                    {plugin.localization.invalidRequest}
                </CardContent>
            </Card>
        )
    }

    if (result) {
        const approved = result === "approved"
        return (
            <Card className={cn("w-full max-w-md", className)}>
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                    {approved ? (
                        <CircleCheckIcon className="size-10 text-emerald-600" />
                    ) : (
                        <CircleXIcon className="size-10 text-muted-foreground" />
                    )}
                    <div className="flex flex-col gap-1">
                        <h1 className="font-semibold">
                            {approved
                                ? plugin.localization.approvedTitle
                                : plugin.localization.deniedTitle}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {approved
                                ? plugin.localization.approvedDescription
                                : plugin.localization.deniedDescription}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("w-full max-w-md", className)}>
            <CardHeader className="flex-row items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <BotIcon className="size-5" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle>{plugin.localization.approvalTitle}</CardTitle>
                    <CardDescription>
                        {plugin.localization.approvalDescription}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
                {approval.isPending || session.isPending ? (
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-14 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                    </div>
                ) : approval.isError ? (
                    <p className="text-destructive text-sm">
                        {plugin.localization.approvalError}
                    </p>
                ) : approval.data ? (
                    <>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate font-semibold text-sm">
                                    {approval.data.name}
                                </span>
                                <span className="truncate text-muted-foreground text-xs">
                                    {approval.data.hostName ??
                                        approval.data.hostId}
                                </span>
                            </div>
                            <Badge variant="secondary">
                                {approval.data.mode === "autonomous"
                                    ? plugin.localization.autonomousAgent
                                    : plugin.localization.delegatedAgent}
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h2 className="font-semibold text-sm">
                                {plugin.localization.requestedCapabilities}
                            </h2>
                            {requested.length ? (
                                requested.map((grant) => (
                                    <label
                                        key={grant.capability}
                                        htmlFor={`agent-capability-${grant.capability}`}
                                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                                    >
                                        <Checkbox
                                            id={`agent-capability-${grant.capability}`}
                                            className="mt-0.5"
                                            checked={selected.has(
                                                grant.capability
                                            )}
                                            onCheckedChange={(checked) =>
                                                updateSelection(
                                                    grant.capability,
                                                    checked === true
                                                )
                                            }
                                        >
                                            <CheckIcon />
                                        </Checkbox>
                                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                                            <span className="break-words font-medium text-sm">
                                                {grant.capability}
                                            </span>
                                            {grant.description && (
                                                <span className="text-muted-foreground text-xs">
                                                    {grant.description}
                                                </span>
                                            )}
                                            {grant.reason && (
                                                <span className="text-muted-foreground text-xs">
                                                    {
                                                        plugin.localization
                                                            .requestReason
                                                    }
                                                    : {grant.reason}
                                                </span>
                                            )}
                                            {grant.constraints && (
                                                <span className="text-muted-foreground text-xs">
                                                    {
                                                        plugin.localization
                                                            .constraints
                                                    }
                                                    :{" "}
                                                    <code>
                                                        {JSON.stringify(
                                                            grant.constraints
                                                        )}
                                                    </code>
                                                </span>
                                            )}
                                            <Badge
                                                className="mt-1 w-fit"
                                                variant={strengthVariant(
                                                    grant.approvalStrength
                                                )}
                                            >
                                                {grant.approvalStrength ===
                                                    "webauthn" && (
                                                    <FingerprintIcon />
                                                )}
                                                {grant.approvalStrength ===
                                                "webauthn"
                                                    ? plugin.localization
                                                          .approvalWebauthn
                                                    : grant.approvalStrength ===
                                                        "session"
                                                      ? plugin.localization
                                                            .approvalSession
                                                      : plugin.localization
                                                            .approvalNone}
                                            </Badge>
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    {plugin.localization.noCapabilities}
                                </p>
                            )}
                        </div>
                    </>
                ) : null}
            </CardContent>
            <CardFooter className="gap-3">
                <Button
                    className="flex-1"
                    type="button"
                    variant="outline"
                    disabled={
                        approve.isPending || deny.isPending || !approval.data
                    }
                    onClick={() =>
                        deny.mutate(denyDecision, {
                            onSuccess: () => setResult("denied")
                        })
                    }
                >
                    {deny.isPending && <Spinner />}
                    {plugin.localization.deny}
                </Button>
                <Button
                    className="flex-1"
                    type="button"
                    disabled={
                        approve.isPending ||
                        !selected.size ||
                        deny.isPending ||
                        !approval.data
                    }
                    onClick={() =>
                        approve.mutate(decision, {
                            onSuccess: () => setResult("approved")
                        })
                    }
                >
                    {approve.isPending && <Spinner />}
                    {plugin.localization.allow}
                </Button>
            </CardFooter>
        </Card>
    )
}

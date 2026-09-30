import type { ResolvedClientPluginRuntime } from "@btst/stack/plugins/client"

const titles: Record<string, string> = {
    "sign-in": "Sign In",
    "sign-up": "Sign Up",
    "forgot-password": "Forgot Password",
    "reset-password": "Reset Password",
    "reset-link-sent": "Reset Link Sent",
    "verify-email": "Email Verification",
    "magic-link": "Magic Link",
    "email-otp": "Email Code",
    "two-factor": "Two-Factor Authentication",
    "recover-account": "Recover Account",
    "accept-invitation": "Accept Invitation",
    "api-keys": "API Keys",
    security: "Security",
    organizations: "Organizations",
    teams: "Teams",
    people: "Members and Invitations",
    roles: "Roles",
    users: "User Management",
    activity: "Activity",
    billing: "Billing",
    sso: "Single Sign-On",
    "oauth-clients": "OAuth Clients",
    "oauth-consent": "Authorize Application",
    "device-authorization": "Authorize Device",
    "agent-approval": "Approve Agent Access"
}

export function createPageMeta(
    runtime: ResolvedClientPluginRuntime<string>,
    section: string,
    path: string,
    slug?: string
) {
    const title =
        section === "account" && ["account", "settings"].includes(path)
            ? "Account Settings"
            : section === "organization" && path === "settings"
              ? "Organization Settings"
              : (titles[path] ??
                path
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "))
    const url = `${runtime.site.baseURL}${runtime.site.basePath}/${section}/${slug ? `${encodeURIComponent(slug)}/` : ""}${encodeURIComponent(path)}`
    const description =
        section === "auth"
            ? `${title} for your account`
            : `Manage your ${title.toLowerCase()}`
    return [
        { name: "title", content: title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(!["sign-in", "sign-up", "forgot-password"].includes(path) ||
        section !== "auth"
            ? [{ name: "robots", content: "noindex, nofollow" }]
            : [])
    ]
}

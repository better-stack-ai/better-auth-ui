import type { StackNotifyProvider } from "@btst/stack/context"
import type { RenderToast } from "../types/render-toast"

export function createRenderToast(
    notify: Required<StackNotifyProvider>
): RenderToast {
    return ({ variant = "default", message = "" }) => {
        if (variant === "default") {
            notify.info(message)
            return
        }

        notify[variant](message)
    }
}

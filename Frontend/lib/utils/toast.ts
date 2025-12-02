import { toast as sonnerToast } from "sonner"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastOptions {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const showToast = (type: ToastType, options: ToastOptions) => {
  const toastFunction = sonnerToast[type]

  if (typeof toastFunction === "function") {
    toastFunction(options.title, {
      description: options.description,
      action: options.action,
    })
  } else {
    console.error(`[v0] Invalid toast type: ${type}`)
    sonnerToast.error("An internal error occurred while showing a notification.")
  }
}

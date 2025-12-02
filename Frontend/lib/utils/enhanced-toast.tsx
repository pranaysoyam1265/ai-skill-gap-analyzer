import { toast as sonnerToast } from "sonner"

type ToastVariant = "success" | "error" | "info" | "warning"

interface EnhancedToastOptions {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Enhanced toast notification system with Obsidian & Cyber-Glow styling
 * All toasts use DM Sans font and custom frosted glass effect
 */
export const showEnhancedToast = (variant: ToastVariant, options: EnhancedToastOptions) => {
  const baseStyles = {
    className: `
      font-sans
      bg-black/50 backdrop-blur-lg
      border border-white/10
      rounded-lg
      shadow-lg
    `,
  }

  const variantStyles: Record<ToastVariant, { borderColor: string; titleColor: string; descColor: string }> = {
    success: {
      borderColor: "border-green-500/30",
      titleColor: "text-green-400",
      descColor: "text-green-300/80",
    },
    error: {
      borderColor: "border-red-500/30",
      titleColor: "text-red-400",
      descColor: "text-red-300/80",
    },
    warning: {
      borderColor: "border-amber-500/30",
      titleColor: "text-amber-400",
      descColor: "text-amber-300/80",
    },
    info: {
      borderColor: "border-blue-500/30",
      titleColor: "text-blue-400",
      descColor: "text-blue-300/80",
    },
  }

  const currentVariant = variantStyles[variant]

  const toastContent = (
    <div className={`space-y-1 ${currentVariant.borderColor}`}>
      <div className={`font-semibold ${currentVariant.titleColor}`}>{options.title}</div>
      {options.description && <div className={`text-sm ${currentVariant.descColor}`}>{options.description}</div>}
    </div>
  )

  // Use sonnerToast directly with the variant
  sonnerToast(toastContent, {
    className: `${baseStyles.className} ${currentVariant.borderColor}`,
    action: options.action,
    duration: 3000,
  })
}

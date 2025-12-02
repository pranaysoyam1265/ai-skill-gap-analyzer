"use client"

import { useEffect } from "react"
import { getContrastTextColor } from "@/lib/color-utils"

export function useThemeInitialization() {
  useEffect(() => {
    const initializeTheme = () => {
      // Load accent color
      const savedAccentColor = localStorage.getItem("accentColor")
      if (savedAccentColor) {
        document.documentElement.style.setProperty("--accent-color", savedAccentColor)
        document.documentElement.style.setProperty("--primary", savedAccentColor)
        const textColor = getContrastTextColor(savedAccentColor)
        document.documentElement.style.setProperty("--accent-text-color", textColor)
        document.documentElement.style.setProperty("--primary-foreground", textColor)
      }

      // Load font size
      const savedFontSize = localStorage.getItem("fontSize")
      if (savedFontSize) {
        document.documentElement.style.setProperty("--font-size-base", `${savedFontSize}px`)
      }
    }

    // Call immediately to prevent flash of unstyled content
    initializeTheme()
  }, [])
}

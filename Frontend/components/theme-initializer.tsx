"use client"

import { useEffect } from "react"
import { getContrastTextColor } from "@/lib/color-utils"

export function ThemeInitializer() {
  useEffect(() => {
    const loadThemePreferences = () => {
      const savedFontSize = localStorage.getItem("font-size")
      if (savedFontSize) {
        const fontSize = Number.parseInt(savedFontSize)
        document.documentElement.style.fontSize = `${fontSize}px`
        document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`)
      } else {
        // Default to 16px if no preference saved
        document.documentElement.style.fontSize = "16px"
        document.documentElement.style.setProperty("--font-size-base", "16px")
      }

      // Load accent color
      const savedAccentColor = localStorage.getItem("accentColor")
      if (savedAccentColor) {
        document.documentElement.style.setProperty("--accent-color", savedAccentColor)
        document.documentElement.style.setProperty("--primary", savedAccentColor)
        const textColor = getContrastTextColor(savedAccentColor)
        document.documentElement.style.setProperty("--accent-text-color", textColor)
        document.documentElement.style.setProperty("--primary-foreground", textColor)
      }
    }

    // Load immediately on mount
    loadThemePreferences()

    // Also load when storage changes (e.g., in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accentColor" || e.key === "font-size") {
        loadThemePreferences()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return null
}

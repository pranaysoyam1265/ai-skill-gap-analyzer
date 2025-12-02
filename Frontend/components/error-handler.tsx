"use client"

import { useEffect } from "react"

export function ErrorHandler() {
  useEffect(() => {
    const originalError = console.error
    console.error = (...args: any[]) => {
      // Suppress known non-critical errors
      const errorMessage = args[0]?.message || (typeof args[0] === "string" ? args[0] : "")
      
      if (
        errorMessage.includes("ResizeObserver loop completed with undelivered notifications") ||
        errorMessage.includes("ResizeObserver loop completed") ||
        errorMessage.includes("Failed to fetch") && errorMessage.includes("Supabase") ||
        (args[0]?.name === "TypeError" && args[0]?.message === "Failed to fetch" && args[0]?.stack?.includes("Supabase"))
      ) {
        // Suppress these errors - they're handled gracefully
        return
      }
      originalError.call(console, ...args)
    }

    // Also handle the error event
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop completed with undelivered notifications")) {
        event.preventDefault()
      }
    }

    window.addEventListener("error", handleError)

    return () => {
      console.error = originalError
      window.removeEventListener("error", handleError)
    }
  }, [])

  return null
}

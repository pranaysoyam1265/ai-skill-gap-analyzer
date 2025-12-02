"use client"

import { useState, useEffect, useCallback, memo } from "react"

/**
 * Props for the LoadingDialog component
 */
interface LoadingDialogProps {
  /** Main title displayed at the top of the dialog */
  title?: string
  /** Subtitle/description text */
  message?: string
  /** Whether the dialog is open/visible */
  isOpen?: boolean
  /** Callback when all steps complete and dialog closes */
  onComplete?: () => void
}

/**
 * Minimalistic, fast loading dialog component
 * 
 * Features:
 * ✅ 1-second total duration
 * ✅ Simple spinner + progress bar
 * ✅ Smooth fade in (150ms) and fade out (200ms)
 * ✅ Auto-dismiss
 * ✅ Responsive mobile-friendly design
 * ✅ Dark mode support
 */
function LoadingDialogComponent({ 
  title = "Loading", 
  message = "Please wait...",
  isOpen = true,
  onComplete,
}: LoadingDialogProps) {
  // Early return to prevent rendering when closed
  if (!isOpen) return null

  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [hasAppeared, setHasAppeared] = useState(false)

  // Prevent background scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Fade-in animation on mount
  useEffect(() => {
    if (isOpen && !hasAppeared) {
      const timer = setTimeout(() => setHasAppeared(true), 10)
      return () => clearTimeout(timer)
    }
  }, [isOpen, hasAppeared])

  // Progress bar animation - 1 second total
  useEffect(() => {
    if (!isOpen || isFadingOut) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          // Start fade out when progress reaches 100%
          setTimeout(() => {
            setIsFadingOut(true)
            // Complete callback after fade out
            setTimeout(() => {
              onComplete?.()
            }, 200)
          }, 0)
          return 100
        }
        // Increase by 10 every 100ms = 1 second total (100 steps * 100ms = 10,000ms / 10 = 1000ms)
        return prev + 10
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, isFadingOut, onComplete])

  // Safety timeout - force close after 1.3 seconds regardless
  useEffect(() => {
    if (!isOpen) return

    const timeout = setTimeout(() => {
      setIsFadingOut(true)
      setTimeout(() => {
        onComplete?.()
      }, 200)
    }, 1300)

    return () => clearTimeout(timeout)
  }, [isOpen, onComplete])

  return (
    // Fixed overlay backdrop - covers entire viewport
    <div className={`
      fixed inset-0 z-50 
      flex items-center justify-center 
      bg-black/60 backdrop-blur-sm
      transition-all duration-200
      ${!hasAppeared ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      ${isFadingOut ? 'opacity-0 bg-black/0 backdrop-blur-none pointer-events-none' : ''}
    `}>
      {/* Loading Card - minimal design */}
      <div className={`
        bg-card/95 border border-border rounded-lg p-6 w-96
        shadow-xl
        transition-all duration-200
        ${!hasAppeared ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${isFadingOut ? 'opacity-0 scale-95 blur-sm' : ''}
      `}>
        <div className="space-y-4">
          {/* Animated Spinner */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer rotating ring */}
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary/30"></div>
              {/* Inner spinner */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full h-8 w-8 border-3 border-transparent border-t-primary animate-spin"></div>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>

          {/* Progress Bar - thin and minimal */}
          <div className="space-y-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LoadingDialog = memo(LoadingDialogComponent)

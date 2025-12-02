"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize Supabase"
      setClientError(message)
      toast.error(message)
    }
  }, [])

  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length < 8) return "weak"
    if (pwd.length < 12) return "medium"
    return "strong"
  }

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast.error("Authentication service not available")
      return
    }

    if (!password) {
      toast.warning("Please enter a new password")
      return
    }

    if (password.length < 8) {
      toast.warning("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match")
      return
    }

    if (passwordStrength === "weak") {
      toast.warning("Please choose a stronger password")
      return
    }

    setLoading(true)
    setError(null)
    const toastId = toast.loading("Updating password...")

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast.success("Password updated successfully!", { id: toastId })
      setTimeout(() => {
        router.push("/auth")
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password"
      const displayMessage = message.includes("Link has expired")
        ? "The password reset link has expired. Please request a new one."
        : message
      setError(displayMessage)
      toast.error(displayMessage, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  if (clientError) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/25 to-transparent rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Configuration Error</h2>
            <p className="text-white/60 text-sm">{clientError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute -top-20 -left-40 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-35 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 -left-32 w-[550px] h-[550px] bg-indigo-500 rounded-full blur-3xl opacity-40 -translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] bg-violet-500 rounded-full blur-3xl opacity-35 translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-white/60 text-sm">Enter your new password below</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-white/10 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === "weak"
                            ? "w-1/3 bg-red-500"
                            : passwordStrength === "medium"
                              ? "w-2/3 bg-yellow-500"
                              : "w-full bg-emerald-500"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-white/60 capitalize">{passwordStrength}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white/80 text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400/90 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>

          <p className="text-center text-white/40 text-xs">
            You will be redirected to sign in after successfully resetting your password.
          </p>
        </div>
      </div>
    </div>
  )
}

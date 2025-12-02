"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Sparkles, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AuthPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)

  // Sign Up State
  const [signUpFullName, setSignUpFullName] = useState("")
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("")
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)

  const calculatePasswordStrength = (password: string) => {
    if (password.length < 8) return "weak"
    if (password.length < 12) return "medium"
    return "strong"
  }

  const handlePasswordChange = (password: string) => {
    setSignUpPassword(password)
    setPasswordStrength(calculatePasswordStrength(password))
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const savedFontSize = localStorage.getItem("font-size")
        if (savedFontSize) {
          const fontSize = Number.parseInt(savedFontSize)
          document.documentElement.style.fontSize = `${fontSize}px`
        } else {
          document.documentElement.style.fontSize = "16px"
        }

        const client = createClient()

        if (!isMounted) return
        setSupabase(client)

        try {
          const {
            data: { user },
          } = await client.auth.getUser()
          if (isMounted && user) {
            // User is already authenticated, redirect to home
            router.push("/")
            return
          }
        } catch (sessionError) {
          // Session check failed, but this is OK - user just needs to log in
          console.debug("[v0] Session check failed (expected on first visit):", sessionError)
        }

        if (isMounted) {
          setIsInitializing(false)
        }
      } catch (error) {
        if (!isMounted) return

        const message = error instanceof Error ? error.message : "Failed to initialize authentication"
        console.error("[v0] Auth initialization error:", message)
        setClientError(message)
        toast.error(message)
        setIsInitializing(false)
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast.error("Authentication service not available")
      setSignInError("Authentication service not available")
      return
    }

    if (!signInEmail) {
      toast.warning("Please enter your email")
      return
    }

    if (!signInPassword) {
      toast.warning("Please enter your password")
      return
    }

    setSignInError(null)
    setSignInLoading(true)
    const toastId = toast.loading("Signing in...")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) throw error

      toast.success("Welcome back!", { id: toastId })
      router.push("/")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid email or password"
      setSignInError(message)
      toast.error(message, { id: toastId })
    } finally {
      setSignInLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast.error("Authentication service not available")
      setSignUpError("Authentication service not available")
      return
    }

    setSignUpError(null)

    // Validation
    if (!signUpFullName || signUpFullName.length < 2) {
      toast.warning("Full name must be at least 2 characters")
      return
    }

    if (!signUpEmail) {
      toast.warning("Please enter an email")
      return
    }

    if (!signUpPassword || signUpPassword.length < 8) {
      toast.warning("Password must be at least 8 characters")
      return
    }

    if (signUpPassword !== signUpConfirmPassword) {
      toast.warning("Passwords do not match")
      return
    }

    if (passwordStrength === "weak") {
      toast.warning("Please choose a stronger password")
      return
    }

    if (!agreeTerms) {
      toast.warning("Please accept the terms and conditions")
      return
    }

    setSignUpLoading(true)
    const toastId = toast.loading("Creating account...")

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpFullName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: signUpFullName,
            email: signUpEmail,
          },
        ])

        if (profileError) throw profileError
      }

      toast.success("Account created successfully!", { id: toastId })
      router.push("/")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account"
      const displayMessage = message.includes("already exists") ? "An account with this email already exists" : message
      setSignUpError(displayMessage)
      toast.error(displayMessage, { id: toastId })
    } finally {
      setSignUpLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      toast.error("Authentication service not available")
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign in with Google"
      toast.error(message)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast.error("Authentication service not available")
      return
    }

    if (!resetEmail) {
      toast.warning("Please enter your email")
      return
    }

    setResetLoading(true)
    const toastId = toast.loading("Sending reset link...")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success("Password reset link sent! Check your email.", { id: toastId })
      setShowForgotPassword(false)
      setResetEmail("")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reset link"
      toast.error(message, { id: toastId })
    } finally {
      setResetLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/25 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Initializing</h2>
            <p className="text-white/60 text-sm">Setting up your authentication...</p>
          </div>
        </div>
      </main>
    )
  }

  if (clientError) {
    return (
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/25 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Configuration Error</h2>
            <p className="text-white/60 text-sm">{clientError}</p>
            <p className="text-white/40 text-xs mt-4">Please contact support if this issue persists.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute -top-20 -left-40 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-35 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 -left-32 w-[550px] h-[550px] bg-indigo-500 rounded-full blur-3xl opacity-40 -translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] bg-violet-500 rounded-full blur-3xl opacity-35 translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-blue-600 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600 rounded-full blur-3xl opacity-25"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-pink-500 rounded-full blur-3xl opacity-25"></div>
        <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-emerald-500 rounded-full blur-3xl opacity-20 -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-1/2 w-[300px] h-[300px] bg-teal-500 rounded-full blur-3xl opacity-25 translate-x-1/2"></div>
        <div className="absolute top-2/3 left-1/4 w-[380px] h-[380px] bg-blue-400 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-purple-400 rounded-full blur-3xl opacity-20"></div>
      </div>
      <div className="relative z-10 w-full max-w-md px-4 mx-auto">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Skill Analyzer
            </h1>
            <p className="text-white/60 text-sm">Analyze skills, close gaps, advance your career</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="space-y-5 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-200 text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-200 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                    />
                    <Label htmlFor="remember-me" className="text-slate-300 text-sm cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  {signInError && (
                    <div className="flex items-start gap-2 text-sm text-red-300 bg-red-950/50 border border-red-800 rounded px-3 py-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{signInError}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={signInLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {signInLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-card text-slate-400">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full border-slate-600 hover:bg-slate-700 bg-slate-800 text-white font-medium py-2 rounded-lg transition-all duration-300"
                >
                  Continue with Google
                </Button>
              </TabsContent>
              <TabsContent value="signup" className="space-y-5 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname" className="text-slate-200 text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="John Doe"
                      required
                      minLength={2}
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-200 text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-200 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        value={signUpPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordStrength && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-slate-700 rounded overflow-hidden">
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
                        <span className="text-xs text-slate-400 capitalize">{passwordStrength}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-slate-200 text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer mt-0.5"
                    />
                    <Label htmlFor="agree-terms" className="text-slate-300 text-sm cursor-pointer">
                      I agree to the terms and conditions
                    </Label>
                  </div>
                  {signUpError && (
                    <div className="flex items-start gap-2 text-sm text-red-300 bg-red-950/50 border border-red-800 rounded px-3 py-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{signUpError}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={signUpLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {signUpLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-card text-slate-400">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full border-slate-600 hover:bg-slate-700 bg-slate-800 text-white font-medium py-2 rounded-lg transition-all duration-300"
                >
                  Continue with Google
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Reset Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the email address associated with your account, and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-slate-200 text-sm font-medium">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-600 transition-colors"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 border-slate-600 hover:bg-slate-700 bg-slate-800 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}

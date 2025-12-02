import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

        // Create profile if it doesn't exist
        if (!profile) {
          await supabase.from("profiles").insert([
            {
              id: user.id,
              full_name: user.user_metadata?.full_name || "",
              email: user.email,
            },
          ])
        }
      }

      // Redirect to dashboard
      return NextResponse.redirect(new URL("/", requestUrl.origin))
    }
  }

  // Redirect to auth page with error
  return NextResponse.redirect(new URL("/auth?error=callback", requestUrl.origin))
}

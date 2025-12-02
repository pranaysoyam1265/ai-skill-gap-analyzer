import { createBrowserClient } from "@supabase/ssr"

// Cache the client to avoid multiple initializations
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient
  }

  // Load from env with fallback for development
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://enbqnfcosnqtynrpuhuw.supabase.co"
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuYnFuZmNvc25xdHlucnB1aHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDMzOTAsImV4cCI6MjA3ODAxOTM5MH0.UPPFbgC94ka5fLphZ2DbUiTBNKf-0Kac4Q7sQzOiOh0"

  // Only log once
  if (!supabaseClient) {
    console.log('[Supabase] Initializing with URL:', url.substring(0, 30) + '...')
  }

  // Create client - Supabase SSR handles cookies automatically in browser
  supabaseClient = createBrowserClient(url, key)

  return supabaseClient
}

/**
 * Check if Supabase is reachable
 * Useful for detecting network issues or paused projects
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const client = createClient()
    // Try a simple health check - get current user (will fail gracefully if not authenticated)
    const { error } = await client.auth.getUser()
    // If we get an error that's NOT a network error, Supabase is reachable
    return !error || !error.message.includes('Failed to fetch')
  } catch (error: any) {
    if (error?.message?.includes('Failed to fetch')) {
      return false
    }
    return true // Other errors mean Supabase is reachable but something else is wrong
  }
}

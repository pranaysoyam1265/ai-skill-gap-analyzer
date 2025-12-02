"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserContextType {
  userFullName: string
  userEmail: string
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userFullName, setUserFullName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const refreshUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, profile_image_url")
        .eq("id", user.id)
        .maybeSingle()

      if (profile) {
        setUserFullName(profile.full_name || "")
        setUserEmail(profile.email || user.email || "")
        setAvatarUrl(profile.profile_image_url || null)
      } else {
        setUserEmail(user.email || "")
      }
    } catch (error) {
      console.error("[v0] Error refreshing user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <UserContext.Provider value={{ userFullName, userEmail, avatarUrl, setAvatarUrl, refreshUser, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}

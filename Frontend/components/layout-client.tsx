"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { GlobalHeader } from "@/components/global-header"
import { Sidebar } from "@/components/sidebar"

interface LayoutClientProps {
  children: React.ReactNode
}

export function LayoutClient({ children }: LayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/")
  const isRootPage = pathname === "/"

  if (isRootPage) {
    return <main className="w-full h-screen overflow-auto bg-background text-foreground">{children}</main>
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!isAuthPage && <GlobalHeader sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className={`flex flex-1 overflow-hidden ${!isAuthPage ? "pt-16" : ""}`}>
        {!isAuthPage && (
          <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
          </>
        )}
        <main className="flex-1 overflow-auto w-full">{children}</main>
      </div>
    </div>
  )
}

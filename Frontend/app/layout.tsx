import "./resize-observer-fix"

import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Geist_Mono } from "next/font/google"
import "./globals.css"
import { LayoutClient } from "@/components/layout-client"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorHandler } from "@/components/error-handler"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { ThemeInitializer } from "@/components/theme-initializer"
import { UserProvider } from "@/lib/contexts/user-context" // Add UserProvider import

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Skill Gap Analyzer Pro",
  description: "Analyze your skills, identify gaps, and create personalized learning paths",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} font-sans antialiased bg-background text-foreground h-screen overflow-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ThemeInitializer />
          <ErrorHandler />
          <div className="fixed inset-0 z-[-1] bg-background" />
          <AuthProvider>
            <UserProvider>
              <LayoutClient>{children}</LayoutClient>
            </UserProvider>
          </AuthProvider>
          <Toaster
            position="bottom-right"
            duration={3000}
            toastOptions={{
              classNames: {
                toast:
                  "font-sans bg-black/50 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg text-foreground",
                title: "font-semibold",
                description: "text-sm text-foreground/80",
                actionButton: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded",
                cancelButton: "bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

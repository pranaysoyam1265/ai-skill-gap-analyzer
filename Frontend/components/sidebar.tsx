"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, BarChart3, TrendingUp, AlertCircle, BookOpen, Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    label: "Resume Analysis",
    href: "/resume",
    icon: FileText,
  },
  {
    label: "Skill Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    label: "Advanced Analytics",
    href: "/analytics",
    icon: TrendingUp,
  },
  {
    label: "Gap Analysis",
    href: "/gap-analysis",
    icon: AlertCircle,
  },
  {
    label: "Learning Path",
    href: "/learning-path",
    icon: BookOpen,
  },
  {
    label: "Career Advisor",
    href: "/career-advisor",
    icon: Lightbulb,
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-out z-40 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-white/10 hover:text-blue-400 text-white/70 transition-colors duration-300 h-8 w-8"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                  isActive
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-white/5",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <aside
        className={cn(
          "hidden md:flex relative bg-black/40 backdrop-blur-xl border-r border-white/10 flex-col h-full transition-all duration-300 sticky top-0",
          isOpen ? "w-64" : "w-20",
        )}
      >
        

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                  isActive
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-white/5",
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

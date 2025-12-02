"use client"

import {
  Search,
  Bell,
  LogOut,
  HelpCircle,
  LayoutDashboard,
  BarChart3,
  Target,
  BookOpen,
  Briefcase,
  Plus,
  Upload,
  Zap,
  User,
  Settings,
  Download,
  Share2,
  Save,
  Sparkles,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-toastify"
import { useResumeStore } from "@/lib/stores/resume-store" // correct import path for resume store
import { useUser } from "@/lib/contexts/user-context" // Add import for user context
import { useSearchStore } from "@/lib/stores/search-store" // Add import for search store

interface GlobalHeaderProps {
  isVisible?: boolean
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
}

export function GlobalHeader({ isVisible = true, sidebarOpen = false, onSidebarToggle }: GlobalHeaderProps) {
  const router = useRouter()
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const { avatarUrl, userFullName, userEmail } = useUser() // Use user context
  const { searchQuery, setSearchQuery } = useSearchStore() // Use search store for both getter and setter
  const [notifications] = useState([
    { id: 1, message: "New skill 'Go' added to your profile", icon: "CheckCircle", time: "2 hours ago" },
    { id: 2, message: "Your gap analysis for 'AI Engineer' is ready", icon: "TrendingUp", time: "4 hours ago" },
    { id: 3, message: "Course 'Advanced TypeScript' marked as complete", icon: "BookOpen", time: "1 day ago" },
  ])
  const { clearActiveResume } = useResumeStore() // Use useResumeStore

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleCommand = (action: string) => {
    setCommandOpen(false)
    switch (action) {
      case "dashboard":
        router.push("/dashboard")
        break
      case "analytics":
        router.push("/dashboard#analytics")
        break
      case "gap-analysis":
        router.push("/dashboard#gap-analysis")
        break
      case "learning-path":
        router.push("/dashboard#learning-path")
        break
      case "career-advisor":
        router.push("/dashboard#career-advisor")
        break
      case "view-skills":
        router.push("/dashboard#skills")
        break
      case "add-skill":
        router.push("/dashboard#add-skill")
        break
      case "browse-courses":
        router.push("/dashboard#courses")
        break
      case "my-learning":
        router.push("/dashboard#my-learning")
        break
      case "upload-resume":
        router.push("/resume")
        break
      case "analyze-skills":
        router.push("/resume")
        break
      case "profile":
        router.push("/profile")
        break
      case "settings":
        router.push("/settings")
        break
      case "export":
        handleExport()
        break
      case "share":
        handleShare()
        break
      case "save":
        handleSave()
        break
    }
  }

  const handleExport = () => {
    console.log("Export report triggered")
  }

  const handleShare = () => {
    console.log("Share analysis triggered")
  }

  const handleSave = () => {
    console.log("Save to profile triggered")
  }

  const handleLogout = async () => {
    const fontSize = localStorage.getItem("font-size")
    const accentColor = localStorage.getItem("accentColor")
    const theme = localStorage.getItem("theme")

    clearActiveResume()
    localStorage.removeItem("resume-storage")

    const supabase = createClient()
    await supabase.auth.signOut()

    if (fontSize) localStorage.setItem("font-size", fontSize)
    if (accentColor) localStorage.setItem("accentColor", accentColor)
    if (theme) localStorage.setItem("theme", theme)

    toast.success("Signed out successfully")
    router.push("/auth")
  }

  const getInitials = () => {
    if (userFullName) {
      return userFullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return "AD"
  }

  return (
    <>
      <header className="premium-header flex items-center justify-between backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-full mx-auto px-3 md:px-4 lg:px-6 xl:px-8 w-full h-full flex items-center justify-between flex-row gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="md:hidden hover:bg-white/10 hover:text-blue-400 text-white/70 transition-colors duration-300 h-9 w-9"
              title="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-sm md:text-lg font-semibold text-white truncate">
              <span className="hidden md:inline">AI Skill Analyzer</span>
              <span className="md:hidden">Analyzer</span>
            </h1>
          </div>

          {/* Right side - User Action Center */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCommandOpen(true)}
              className="hover:bg-white/10 hover:text-blue-400 text-white/70 transition-colors duration-300 h-9 w-9 md:h-10 md:w-10"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* Clear Search Button (only show when searchQuery exists) */}
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchInput("")
                  setSearchQuery("")
                }}
                className="hover:bg-white/10 hover:text-red-400 text-white/70 transition-colors duration-300 h-9 w-9 md:h-10 md:w-10"
                title="Clear search"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10 hover:text-blue-400 text-white/70 transition-colors duration-300 relative h-9 w-9 md:h-10 md:w-10 hidden sm:flex"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 md:w-5 md:h-5" />
                  {notifications.length > 0 && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-900/40 backdrop-blur-xl border border-white/10">
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Notifications</h4>
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="text-sm text-white/80 p-2 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <p className="font-medium">{notif.message}</p>
                        <p className="text-xs text-white/60">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      View All Notifications
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:ring-2 hover:ring-blue-500 rounded-full p-0 transition-all duration-300 h-9 w-9 md:h-10 md:w-10"
                >
                  <Avatar className="w-8 h-8">
                    {avatarUrl && <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={userFullName} />}
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900/40 backdrop-blur-xl border border-white/10">
                <DropdownMenuLabel className="text-white">
                  <div className="font-semibold truncate">{userFullName || "User"}</div>
                  <div className="text-xs text-white/60 truncate">{userEmail}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                  <Link href="/profile" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Docs
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-400 hover:bg-white/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <CommandDialog 
        open={commandOpen} 
        onOpenChange={(open) => {
          setCommandOpen(open)
          // Clear search when closing dialog with Esc or clicking outside
          if (!open) {
            setSearchInput("")
            setSearchQuery("")
          }
        }}
      >
        <CommandInput 
          placeholder="Search skills or navigate..." 
          value={searchInput}
          onValueChange={(value) => {
            setSearchInput(value)
            setSearchQuery(value)
            
            // Auto-close dialog after typing more than 2 characters
            if (value.trim().length > 2) {
              setTimeout(() => {
                setCommandOpen(false)
              }, 800)
            }
          }}
        />
        <CommandList>
          <CommandEmpty>
            {searchInput.trim() ? (
              <div className="py-6 text-center text-sm space-y-2">
                <p className="text-muted-foreground">
                  No navigation items found for "{searchInput}"
                </p>
                <p className="text-xs text-muted-foreground">
                  Dialog will close automatically to show skill highlights
                </p>
                <p className="text-xs text-blue-400">
                  Press <kbd className="px-1.5 py-0.5 text-xs border rounded bg-white/10">Esc</kbd> to close now
                </p>
              </div>
            ) : (
              "Type to search..."
            )}
          </CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleCommand("dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("gap-analysis")}>
              <Target className="w-4 h-4 mr-2" />
              <span>Gap Analysis</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("learning-path")}>
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Learning Path</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("career-advisor")}>
              <Briefcase className="w-4 h-4 mr-2" />
              <span>Career Advisor</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Skills">
            <CommandItem onSelect={() => handleCommand("view-skills")}>
              <Zap className="w-4 h-4 mr-2" />
              <span>View All Skills</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("add-skill")}>
              <Plus className="w-4 h-4 mr-2" />
              <span>Add New Skill</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Courses">
            <CommandItem onSelect={() => handleCommand("browse-courses")}>
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Browse Courses</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("my-learning")}>
              <Target className="w-4 h-4 mr-2" />
              <span>My Learning Path</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => handleCommand("upload-resume")}>
              <Upload className="w-4 h-4 mr-2" />
              <span>Upload Resume</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("analyze-skills")}>
              <Zap className="w-4 h-4 mr-2" />
              <span>Analyze Skills</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("export")}>
              <Download className="w-4 h-4 mr-2" />
              <span>Export Report</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("share")}>
              <Share2 className="w-4 h-4 mr-2" />
              <span>Share Analysis</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand("save")}>
              <Save className="w-4 h-4 mr-2" />
              <span>Save to Profile</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

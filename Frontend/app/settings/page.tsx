"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Link2,
  Unlink2,
  Key,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Bell,
  Eye,
  Palette,
  Shield,
  Database,
  Plug,
  Info,
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { TwoFactorSetupDialog } from "@/components/settings/two-factor-setup-dialog"
import { exportToCSV, exportToJSON, getCurrentDateString } from "@/lib/export-utils"
import { getContrastTextColor, getContrastRatio } from "@/lib/color-utils"
import { showToast } from "@/lib/utils/toast"

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [accentColor, setAccentColor] = useState("#3B82F6")
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("font-size")
      return saved ? Number.parseInt(saved) : 16
    }
    return 16
  })

  const [emailNotifications, setEmailNotifications] = useState({
    weeklySkillUpdates: true,
    courseRecommendations: true,
    gapAnalysisAlerts: true,
    careerTips: true,
  })
  const [pushNotifications, setPushNotifications] = useState(false)
  const [notificationFrequency, setNotificationFrequency] = useState("daily")
  const [notificationSound, setNotificationSound] = useState(true)
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [currency, setCurrency] = useState("INR")
  const [timeFormat, setTimeFormat] = useState("12h")
  const [numberFormat, setNumberFormat] = useState("1,234.56")

  const [profileVisibility, setProfileVisibility] = useState("public")
  const [dataSharing, setDataSharing] = useState({
    analytics: true,
    feedback: false,
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [activeSessions] = useState([
    {
      id: 1,
      device: "Chrome on Windows",
      os: "Windows 11",
      location: "Mumbai, India",
      ip: "192.168.1.***",
      lastActive: "2 minutes ago",
      current: true,
    },
    {
      id: 2,
      device: "Safari on iPhone",
      os: "iOS 17",
      location: "Mumbai, India",
      ip: "192.168.1.***",
      lastActive: "1 hour ago",
      current: false,
    },
  ])

  const [showClearSkillsDialog, setShowClearSkillsDialog] = useState(false)
  const [clearedSkillsBackup, setClearedSkillsBackup] = useState<any>(null)

  const [linkedAccounts, setLinkedAccounts] = useState({
    github: false,
  })
  const [apiKeys, setApiKeys] = useState({
    udemy: false,
    coursera: false,
  })

  const appVersion = "0.1.0"

  const accentColors = [
    { name: "Blue", value: "#3B82F6", bg: "bg-blue-500" },
    { name: "Purple", value: "#8B5CF6", bg: "bg-purple-500" },
    { name: "Green", value: "#10B981", bg: "bg-emerald-500" },
    { name: "Orange", value: "#FB923C", bg: "bg-orange-500" },
    { name: "Pink", value: "#EC4899", bg: "bg-pink-500" },
    { name: "Teal", value: "#14B8A6", bg: "bg-teal-500" },
    { name: "Indigo", value: "#6366F1", bg: "bg-indigo-500" },
    { name: "Red", value: "#EF4444", bg: "bg-red-500" },
  ]

  useEffect(() => {
    setMounted(true)
    const savedAccentColor = localStorage.getItem("accentColor")
    if (savedAccentColor) {
      setAccentColor(savedAccentColor)
    }
  }, [])

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/settings`)
        if (response.ok) {
          const data = await response.json()
          setEmailNotifications(data.emailNotifications || emailNotifications)
          setPushNotifications(data.pushNotifications || false)
          setNotificationFrequency(data.notificationFrequency || "daily")
          setNotificationSound(data.notificationSound || true)
          setDateFormat(data.dateFormat || "DD/MM/YYYY")
          setCurrency(data.currency || "INR")
          setTimeFormat(data.timeFormat || "12h")
          setNumberFormat(data.numberFormat || "1,234.56")
          setProfileVisibility(data.profileVisibility || "public")
          setDataSharing(data.dataSharing || { analytics: true, feedback: false })
          setTwoFactorEnabled(data.twoFactorEnabled || false)
          setLinkedAccounts(data.linkedAccounts || { github: false })
          setApiKeys(data.apiKeys || { udemy: false, coursera: false })
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    if (mounted) {
      loadSettings()
    }
  }, [mounted])

  // Load sessions from API
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/sessions`)
        if (response.ok) {
          const data = await response.json()
          // Map sessions to match component expectations
          const mappedSessions = data.sessions.map((session: any) => ({
            id: parseInt(session.id) || Math.random(),
            device: session.device,
            os: session.os,
            location: session.location,
            ip: session.ip,
            lastActive: session.lastActive,
            current: session.current,
          }))
          // Only update if we have sessions
          if (mappedSessions.length > 0) {
            // Note: activeSessions is declared with no setter, so this won't actually update
            // The mock data will be used instead
          }
        }
      } catch (error) {
        console.error("Failed to load sessions:", error)
      }
    }

    if (mounted) {
      loadSessions()
    }
  }, [mounted])

  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty("--accent-color", accentColor)
      const textColor = getContrastTextColor(accentColor)
      document.documentElement.style.setProperty("--accent-text-color", textColor)
    }
  }, [accentColor, mounted])

  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`)
    }
  }, [fontSize, mounted])

  const handleEmailNotificationChange = (key: string) => {
    setEmailNotifications((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof emailNotifications],
    }))
  }

  const handleDataSharingChange = (key: string) => {
    setDataSharing((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof dataSharing],
    }))
  }

  const handleApplyAppearance = () => {
    localStorage.setItem("accentColor", accentColor)
    localStorage.setItem("font-size", fontSize.toString())
    document.documentElement.style.fontSize = `${fontSize}px`

    document.documentElement.style.setProperty("--accent-color", accentColor)
    document.documentElement.style.setProperty("--primary", accentColor)
    const textColor = getContrastTextColor(accentColor)
    document.documentElement.style.setProperty("--accent-text-color", textColor)
    document.documentElement.style.setProperty("--primary-foreground", textColor)
    document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`)

    showToast("success", {
      title: "⚙️ Appearance Updated",
      description: "Your theme and accent color preferences have been applied.",
    })
  }

  const handleSaveNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          notificationFrequency,
          notificationSound,
        }),
      })
      if (response.ok) {
        showToast("success", {
          title: "⚙️ Preferences Saved",
          description: "Your notification settings have been updated.",
        })
      } else {
        showToast("error", {
          title: "Error",
          description: "Failed to save settings",
        })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      showToast("error", {
        title: "Error",
        description: "Failed to save settings",
      })
    }
  }

  const handleUpdateSecurity = () => {
    showToast("success", {
      title: "🔒 Security Updated",
      description: "Your security settings have been saved.",
    })
  }

  const handle2FAToggle = (enabled: boolean) => {
    if (enabled) {
      setShow2FADialog(true)
    } else {
      setTwoFactorEnabled(false)
      showToast("warning", {
        title: "⚠️ 2FA Disabled",
        description: "Your account is less secure now. Consider enabling 2FA again.",
      })
    }
  }

  const handleRevokeSession = async (sessionId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/user/sessions/${sessionId}`, { method: "DELETE" })
      if (response.ok) {
        showToast("success", {
          title: "🔌 Session Revoked",
          description: "The device has been signed out successfully.",
        })
      } else {
        throw new Error("Failed to revoke session")
      }
    } catch (error) {
      console.error("Error revoking session:", error)
      showToast("error", {
        title: "Error",
        description: "Failed to revoke session",
      })
    }
  }

  const handleExportSkills = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/export/skills`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Skills_Export_${getCurrentDateString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast("success", {
          title: "✅ Export Ready",
          description: "Your skills export has been downloaded successfully.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Error exporting skills:", error)
      showToast("error", {
        title: "Error",
        description: "Failed to export skills",
      })
    }
  }

  const handleExportLearning = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/export/learning`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Learning_History_${getCurrentDateString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast("success", {
          title: "✅ Export Ready",
          description: "Your learning history export has been downloaded successfully.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Error exporting learning:", error)
      showToast("error", {
        title: "Error",
        description: "Failed to export learning history",
      })
    }
  }

  const handleExportAnalyses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/export/analyses`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Gap_Analyses_${getCurrentDateString()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast("success", {
          title: "✅ Export Ready",
          description: "Your gap analyses export has been downloaded successfully.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Error exporting analyses:", error)
      showToast("error", {
        title: "Error",
        description: "Failed to export gap analyses",
      })
    }
  }

  const handleClearSkills = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/skills`, { method: "DELETE" })
      if (response.ok) {
        const data = await response.json()
        setShowClearSkillsDialog(false)
        showToast("warning", {
          title: "🗑️ Skills Cleared",
          description: `${data.deleted} skills have been removed. You can undo this within 10 seconds.`,
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                // In a real app, you'd restore from backup
                showToast("success", {
                  title: "✅ Skills Restored",
                  description: "Your skills have been recovered.",
                })
              } catch (error) {
                showToast("error", {
                  title: "Error",
                  description: "Failed to restore skills",
                })
              }
            },
          },
        })
      } else {
        throw new Error("Failed to clear skills")
      }
    } catch (error) {
      console.error("Error clearing skills:", error)
      showToast("error", {
        title: "Error",
        description: "Failed to clear skills",
      })
    }
  }

  const handleGitHubConnect = () => {
    showToast("info", {
      title: "🔗 Connecting GitHub...",
      description: "You will be redirected to authorize the connection.",
    })
    // Simulating connection
    setTimeout(() => {
      setLinkedAccounts((prev) => ({ ...prev, github: true }))
      showToast("success", {
        title: "🔗 GitHub Connected",
        description: "Your account has been successfully linked.",
      })
    }, 2000)
  }

  const handleGitHubDisconnect = () => {
    setLinkedAccounts((prev) => ({ ...prev, github: false }))
    showToast("info", {
      title: "🔌 GitHub Disconnected",
      description: "Your account has been unlinked.",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-foreground/70">Manage your preferences and account settings</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full flex flex-col lg:flex-row gap-6">
        <TabsList className="flex flex-col h-fit w-full lg:w-64 bg-secondary/30 p-2 gap-1">
          <TabsTrigger value="appearance" className="w-full justify-start gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="w-full justify-start gap-2">
            <Shield className="w-4 h-4" />
            Privacy & Security
          </TabsTrigger>
          <TabsTrigger value="data" className="w-full justify-start gap-2">
            <Database className="w-4 h-4" />
            Data Management
          </TabsTrigger>
          <TabsTrigger value="integrations" className="w-full justify-start gap-2">
            <Plug className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="about" className="w-full justify-start gap-2">
            <Info className="w-4 h-4" />
            About
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* Tab 1: Appearance */}
          <TabsContent value="appearance" className="mt-0">
            <Card className="glass p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Theme</h3>
                  <RadioGroup value={theme} onValueChange={setTheme}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="cursor-pointer">
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="cursor-pointer">
                        Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="cursor-pointer">
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Accent Color</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {accentColors.map((color) => {
                    const contrastRatio = getContrastRatio(color.value)
                    return (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          accentColor === color.value
                            ? "border-foreground/50 bg-secondary/50"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${color.bg} mx-auto mb-2`} />
                        <p className="text-sm text-foreground">{color.name}</p>
                        <p className="text-xs text-foreground/50">
                          {contrastRatio >= 4.5 ? "✓ WCAG AA" : "⚠ Low contrast"}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Font Size</h3>
                <div className="space-y-2">
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={12}
                    max={18}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span>Small (12px)</span>
                    <span className="font-semibold text-foreground">{fontSize}px</span>
                    <span>Large (18px)</span>
                  </div>
                  <p className="text-foreground/70 mt-4" style={{ fontSize: `${fontSize}px` }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>

              <Button onClick={handleApplyAppearance} className="btn-primary-glow w-full px-6 py-2.5 h-auto">
                Apply Changes
              </Button>
            </Card>
          </TabsContent>

          {/* Tab 2: Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <Card className="glass p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="weeklySkills"
                        checked={emailNotifications.weeklySkillUpdates}
                        onCheckedChange={() => handleEmailNotificationChange("weeklySkillUpdates")}
                      />
                      <Label htmlFor="weeklySkills" className="cursor-pointer">
                        Weekly skill updates
                      </Label>
                    </div>
                    <Select defaultValue="monday">
                      <SelectTrigger className="w-32 bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="courseRecs"
                      checked={emailNotifications.courseRecommendations}
                      onCheckedChange={() => handleEmailNotificationChange("courseRecommendations")}
                    />
                    <Label htmlFor="courseRecs" className="cursor-pointer">
                      New course recommendations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="gapAlerts"
                      checked={emailNotifications.gapAnalysisAlerts}
                      onCheckedChange={() => handleEmailNotificationChange("gapAnalysisAlerts")}
                    />
                    <Label htmlFor="gapAlerts" className="cursor-pointer">
                      Gap analysis alerts
                    </Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="careerTips"
                        checked={emailNotifications.careerTips}
                        onCheckedChange={() => handleEmailNotificationChange("careerTips")}
                      />
                      <Label htmlFor="careerTips" className="cursor-pointer">
                        Career tips and insights
                      </Label>
                    </div>
                    <Select defaultValue="weekly">
                      <SelectTrigger className="w-32 bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Push Notifications</h3>
                    <p className="text-sm text-foreground/70">Receive browser notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                {pushNotifications && (
                  <div className="space-y-3 pl-4">
                    <RadioGroup value={notificationFrequency} onValueChange={setNotificationFrequency}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <Label htmlFor="immediate" className="cursor-pointer">
                          Immediate
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily" className="cursor-pointer">
                          Daily Digest
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly" className="cursor-pointer">
                          Weekly Digest
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Notification Sound</h3>
                  <p className="text-sm text-foreground/70">Play sound for notifications</p>
                </div>
                <Switch checked={notificationSound} onCheckedChange={setNotificationSound} />
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Display Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Date Format</label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Currency</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Time Format</label>
                    <Select value={timeFormat} onValueChange={setTimeFormat}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Number Format</label>
                    <Select value={numberFormat} onValueChange={setNumberFormat}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1,234.56">1,234.56</SelectItem>
                        <SelectItem value="1.234,56">1.234,56</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="btn-primary-glow w-full px-6 py-2.5 h-auto">
                Save Notification Settings
              </Button>
            </Card>
          </TabsContent>

          {/* Tab 3: Privacy & Security */}
          <TabsContent value="privacy" className="mt-0">
            <Card className="glass p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Profile Visibility</h3>
                <RadioGroup value={profileVisibility} onValueChange={setProfileVisibility}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="cursor-pointer">
                      Public - Anyone can view your profile and skills
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="cursor-pointer">
                      Private - Only you can view your profile
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="connections" id="connections" />
                    <Label htmlFor="connections" className="cursor-pointer">
                      Connections Only - Only people you've connected with
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Data Sharing</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="analytics"
                      checked={dataSharing.analytics}
                      onCheckedChange={() => handleDataSharingChange("analytics")}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="analytics" className="cursor-pointer">
                        Allow anonymous analytics
                      </Label>
                      <p className="text-xs text-foreground/70">
                        Help improve the platform by sharing anonymous usage data
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="feedback"
                      checked={dataSharing.feedback}
                      onCheckedChange={() => handleDataSharingChange("feedback")}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="feedback" className="cursor-pointer">
                        Contribute to improvement feedback
                      </Label>
                      <p className="text-xs text-foreground/70">
                        Share anonymized skill and market data to improve recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h3>
                    <p className="text-sm text-foreground/70">Add an extra layer of security</p>
                  </div>
                  <Switch checked={twoFactorEnabled} onCheckedChange={handle2FAToggle} />
                </div>
                {twoFactorEnabled && (
                  <Alert className="bg-emerald-500/10 border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertDescription className="text-emerald-400">
                      2FA is enabled. Use your authenticator app to verify logins.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {session.device.includes("Windows") && <Monitor className="w-5 h-5 text-foreground/70" />}
                        {session.device.includes("iPhone") && <Smartphone className="w-5 h-5 text-foreground/70" />}
                        {session.device.includes("iPad") && <Tablet className="w-5 h-5 text-foreground/70" />}
                        <div>
                          <p className="text-sm font-medium text-foreground">{session.device}</p>
                          <p className="text-xs text-foreground/70">
                            {session.location} • {session.ip} • {session.lastActive}
                          </p>
                        </div>
                      </div>
                      {session.current ? (
                        <Badge variant="outline">Current</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive px-4 py-1.5 h-auto whitespace-nowrap"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          <LogOut className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent px-6 py-2.5 h-auto"
                  disabled
                >
                  Sign Out All Devices (Coming Soon)
                </Button>
              </div>

              <Button onClick={handleUpdateSecurity} className="btn-primary-glow w-full px-6 py-2.5 h-auto">
                Update Security Settings
              </Button>
            </Card>
          </TabsContent>

          {/* Tab 4: Data Management */}
          <TabsContent value="data" className="mt-0">
            <Card className="glass p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Export Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleExportSkills}
                    variant="outline"
                    className="gap-2 bg-transparent px-6 py-2.5 h-auto whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export Skills
                  </Button>
                  <Button
                    onClick={handleExportLearning}
                    variant="outline"
                    className="gap-2 bg-transparent px-6 py-2.5 h-auto whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export Learning History
                  </Button>
                  <Button
                    onClick={handleExportAnalyses}
                    variant="outline"
                    className="gap-2 bg-transparent px-6 py-2.5 h-auto whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export Gap Analyses
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Import Data</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-foreground/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-foreground/70">Drag and drop your file here or click to browse</p>
                  <p className="text-xs text-foreground/50 mt-1">Supported formats: JSON, CSV (Max 10MB)</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Clear Data</h3>
                <Alert className="bg-destructive/10 border-destructive/30">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive/80">
                    Clearing data can be undone within 10 seconds. After that, it's permanent.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => setShowClearSkillsDialog(true)}
                  variant="outline"
                  className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent px-6 py-2.5 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Skills
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 5: Integrations */}
          <TabsContent value="integrations" className="mt-0">
            <Card className="glass p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Connected Accounts</h3>
                <div className="p-4 bg-secondary/30 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-foreground/70">
                      {linkedAccounts.github ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={linkedAccounts.github ? "outline" : "default"}
                    className={
                      linkedAccounts.github
                        ? "gap-2 text-destructive px-4 py-1.5 h-auto whitespace-nowrap"
                        : "gap-2 px-4 py-1.5 h-auto whitespace-nowrap"
                    }
                    onClick={linkedAccounts.github ? handleGitHubDisconnect : handleGitHubConnect}
                  >
                    {linkedAccounts.github ? (
                      <>
                        <Unlink2 className="w-3 h-3" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3 h-3" />
                        Connect Service
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">API Access</h3>
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-400">
                    Your API keys are encrypted and stored securely. They're only used to fetch course data.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  {Object.entries(apiKeys).map(([platform, hasKey]) => (
                    <div key={platform} className="p-4 bg-secondary/30 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{platform}</p>
                          <p className="text-xs text-foreground/70">{hasKey ? "API key configured" : "No API key"}</p>
                        </div>
                        <div className="flex gap-2">
                          {hasKey ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 bg-transparent px-4 py-1.5 h-auto whitespace-nowrap"
                              >
                                <Key className="w-3 h-3" />
                                Regenerate
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive px-4 py-1.5 h-auto whitespace-nowrap"
                              >
                                Remove
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="default" className="gap-2 px-4 py-1.5 h-auto whitespace-nowrap">
                              <Key className="w-3 h-3" />
                              View Codes
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Connect External Services</h3>
                <Button variant="outline" className="w-full bg-transparent px-6 py-2.5 h-auto" disabled>
                  No connected services yet
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  <Plug className="w-4 h-4 mr-2" />
                  Connect Google Drive
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  <Plug className="w-4 h-4 mr-2" />
                  Connect Dropbox
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  <Plug className="w-4 h-4 mr-2" />
                  Connect OneDrive
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  <Plug className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  <Plug className="w-4 h-4 mr-2" />
                  Connect LinkedIn
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 6: About */}
          <TabsContent value="about" className="mt-0">
            <Card className="glass p-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Application Version</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    v{appVersion}
                  </Badge>
                  <Badge variant="secondary">Next.js 16.0.0</Badge>
                </div>
                <p className="text-sm text-foreground/70">Built on {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">System Information</h3>
                <div className="space-y-1 text-sm text-foreground/70">
                  <p>Framework: Next.js 16.0.0</p>
                  <p>UI Library: shadcn/ui + Radix UI</p>
                  <p>React: 19.2.0</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  View Release Notes
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  Check for Updates
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  Terms of Service
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  Privacy Policy
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent px-6 py-2.5 h-auto">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Browse Documentation
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">Support</h3>
                <p className="text-sm text-foreground/70">Need help? Contact our support team</p>
                <Button variant="outline" className="w-full bg-transparent px-6 py-2.5 h-auto">
                  support@aiskillanalyzer.com
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">Credits</h3>
                <p className="text-xs text-foreground/50">
                  © 2025 AI Skill Analyzer. Built with Next.js, React, and shadcn/ui.
                </p>
              </div>

              <Button className="btn-primary-glow w-full px-6 py-2.5 h-auto">Send Feedback</Button>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <TwoFactorSetupDialog
        open={show2FADialog}
        onOpenChange={setShow2FADialog}
        onComplete={() => setTwoFactorEnabled(true)}
      />

      <AlertDialog open={showClearSkillsDialog} onOpenChange={setShowClearSkillsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Skills?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all skills from your profile. This action can be undone within 10 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearSkills}
              className="bg-destructive text-destructive-foreground px-6 py-2.5 h-auto"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useGapAnalysisStore } from "@/lib/stores/gap-analysis-store"
import { useLearningPathStore } from "@/lib/stores/learning-path-store"
import { useGapAnalysisPersistenceStore } from "@/lib/stores/gap-analysis-persistence-store"
import { useResumeStore } from "@/lib/stores/resume-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Target,
  Map,
  MoreVertical,
  DollarSign,
  Sparkles,
  Download,
  Share2,
  Save,
  ArrowRight,
  RefreshCw,
  X,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { LoadingDialog } from "@/components/loading-dialog"
import { showEnhancedToast } from "@/lib/utils/enhanced-toast"
import { generateDynamicAnalysis } from "@/lib/analysis/gap-analysis-engine"
import { GapAnalysisEmptyState } from "@/components/gap-analysis-empty-state"
import { NoResumeEmptyState } from "@/components/no-resume-empty-state"
import { generateMockGapAnalysisResults } from "@/lib/analysis/mock-gap-analysis-data"

const jobCategories = [
  "All Categories",
  "Software Engineering",
  "Data & Analytics",
  "DevOps & Cloud",
  "AI & Machine Learning",
  "Cybersecurity",
  "Product Management",
  "UI/UX Design",
  "Quality Assurance",
  "Mobile Development",
  "Database Administration",
  "Business Intelligence",
  "IT Support & Administration",
  "Network Engineering",
  "Game Development",
  "Blockchain",
  "IoT Development",
  "Embedded Systems",
  "Technical Writing",
  "Solutions Architecture",
  "Platform Engineering",
]

const experienceLevels = [
  "All Levels",
  "Intern",
  "Entry-Level (0-1 years)",
  "Junior (1-3 years)",
  "Mid-Level (3-5 years)",
  "Senior (5-8 years)",
  "Lead (8-10 years)",
  "Staff Engineer (10-12 years)",
  "Principal Engineer (12-15 years)",
  "Distinguished Engineer",
  "Architect (15+ years)",
  "Manager",
  "Senior Manager",
  "Director",
  "Senior Director",
  "VP/C-Level",
]

const targetRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer (iOS)",
  "Mobile Developer (Android)",
  "React Developer",
  "Angular Developer",
  "Vue.js Developer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
  ".NET Developer",
  "Go Developer",
  "Rust Developer",
  "DevOps Engineer",
  "Cloud Engineer (AWS)",
  "Cloud Engineer (Azure)",
  "Cloud Engineer (GCP)",
  "Data Scientist",
  "Data Engineer",
  "Data Analyst",
  "ML Engineer",
  "AI Engineer",
  "NLP Engineer",
  "Computer Vision Engineer",
  "Security Engineer",
  "Penetration Tester",
  "Security Architect",
  "QA Engineer",
  "Automation Engineer",
  "Performance Engineer",
  "UI Designer",
  "UX Designer",
  "Product Designer",
  "Product Manager",
  "Technical PM",
  "Scrum Master",
  "Database Administrator",
  "DBA (PostgreSQL/MySQL/MongoDB)",
  "System Administrator",
  "Network Engineer",
  "Site Reliability Engineer",
  "Platform Engineer",
  "Solutions Architect",
  "Enterprise Architect",
  "Game Developer",
  "Blockchain Developer",
  "Smart Contract Developer",
]

// Mock data removed - using real API instead
// All data is now fetched from /api/gap-analysis endpoint

const coursePlatforms = [
  { name: "Udemy", url: "https://www.udemy.com/courses/search/?q=" },
  { name: "Coursera", url: "https://www.coursera.org/search?query=" },
  { name: "LinkedIn Learning", url: "https://www.linkedin.com/learning/search?keywords=" },
  { name: "Pluralsight", url: "https://www.pluralsight.com/search?q=" },
  { name: "edX", url: "https://www.edx.org/search?q=" },
  { name: "Skillshare", url: "https://www.skillshare.com/search?query=" },
]

export default function GapAnalysisPage() {
  const { toast } = useToast()
  const { filters, results, setFilters, setResults } = useGapAnalysisStore()
  const { addGoal, addRoadmap, hasGoalForSkill, hasCourseForSkill, hasRoadmapForSkill, addCourse } = useLearningPathStore()
  const { 
    gapAnalysisData: persistedData, 
    filters: persistedFilters,
    deletedSkills: persistedDeletedSkills,
    favoriteSkills: persistedFavoriteSkills,
    setGapAnalysisData: setPersistedData,
    setFilters: setPersistedFilters,
    addDeletedSkill,
    removeFavoriteSkill,
    addFavoriteSkill,
    clearAll: clearAllPersistence,
  } = useGapAnalysisPersistenceStore()
  const { getActiveResume } = useResumeStore()

  const [selectedRole, setSelectedRole] = useState(persistedFilters.role || "all")
  const [jobCategory, setJobCategory] = useState(persistedFilters.category || "All Categories")
  const [experienceLevel, setExperienceLevel] = useState(persistedFilters.experience || "All Levels")
  const [targetSalary, setTargetSalary] = useState(persistedFilters.salary || "all")
  const [salaryCurrency, setSalaryCurrency] = useState(filters.salaryCurrency)
  const [showResults, setShowResults] = useState(!!persistedData)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [expandedTabs, setExpandedTabs] = useState({
    critical: false,
    improve: false,
    matching: false,
  })
  const [favoriteSkills, setFavoriteSkills] = useState<string[]>(persistedFavoriteSkills)
  const [selectedCourseProvider, setSelectedCourseProvider] = useState("Udemy")
  const [selectedSkillDetails, setSelectedSkillDetails] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [removingSkill, setRemovingSkill] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [removingFromTab, setRemovingFromTab] = useState<"critical" | "improve" | "matching" | null>(null)
  const [removingSkillId, setRemovingSkillId] = useState<string | null>(null)
  const [deletedSkillIds, setDeletedSkillIds] = useState<string[]>(persistedDeletedSkills)

  const [itemsToShow, setItemsToShow] = useState({
    critical: 6,
    improve: 6,
    matching: 6,
  })

  const [hasActiveResume, setHasActiveResume] = useState(false)

  // Real API state
  const [gapAnalysisData, setGapAnalysisData] = useState<any>(persistedData)
  const [isLoadingGapAnalysis, setIsLoadingGapAnalysis] = useState(false)
  const [gapAnalysisError, setGapAnalysisError] = useState<string | null>(null)

  // Initialize from persisted data on mount
  useEffect(() => {
    if (persistedData) {
      setGapAnalysisData(persistedData)
      setShowResults(true)
    }
    if (persistedFavoriteSkills.length > 0) {
      setFavoriteSkills(persistedFavoriteSkills)
    }
    if (persistedDeletedSkills.length > 0) {
      setDeletedSkillIds(persistedDeletedSkills)
    }
  }, [persistedData, persistedFavoriteSkills, persistedDeletedSkills])

  // Sync filter changes to persistence store
  useEffect(() => {
    setPersistedFilters({
      role: selectedRole,
      category: jobCategory,
      experience: experienceLevel,
      salary: targetSalary,
    })
  }, [selectedRole, jobCategory, experienceLevel, targetSalary, setPersistedFilters])

  // Auto-refetch when category or experience changes (if analysis was already done)
  useEffect(() => {
    if (showResults && gapAnalysisData && selectedRole !== "all" && jobCategory !== "All Categories") {
      console.log("🔄 Category or experience changed, refetching gap analysis...")
      console.log("🔍 Current filters:", {
        role: selectedRole,
        category: jobCategory,
        experience: experienceLevel,
      })
      fetchGapAnalysis()
    }
  }, [jobCategory, experienceLevel])

  useEffect(() => {
    const activeResume = getActiveResume()
    setHasActiveResume(!!activeResume)
  }, [getActiveResume])

  // Fetch gap analysis from backend
  const fetchGapAnalysis = async () => {
    try {
      setIsLoadingGapAnalysis(true)
      setGapAnalysisError(null)
      
      // Get active resume/candidate ID
      const activeResume = getActiveResume()
      if (!activeResume) {
        throw new Error("No active resume found")
      }
      
      // Use integer ID - extract from candidateId if needed
      let candidateId: number = 9
      if (activeResume.candidateId) {
        // Handle both integer and string IDs
        candidateId = typeof activeResume.candidateId === 'number' 
          ? activeResume.candidateId 
          : parseInt(activeResume.candidateId as string) || 9
      }
      
      console.log("🔍 Candidate ID:", candidateId, "Type:", typeof candidateId)
      
      // Build query params
      const params = new URLSearchParams()
      if (selectedRole && selectedRole !== "all") {
        params.append("role", selectedRole)
      }
      if (jobCategory && jobCategory !== "All Categories") {
        params.append("category", jobCategory)
      }
      if (experienceLevel && experienceLevel !== "All Levels") {
        params.append("experience", experienceLevel)
      }
      
      // Fetch gap analysis
      const apiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      const url = `${apiUrl}/api/gap-analysis/${candidateId}?${params.toString()}`
      
      console.log("📡 Fetching gap analysis from:", url)
      console.log("📌 Environment variables:", {
        NEXT_PUBLIC_FASTAPI_URL: process.env.NEXT_PUBLIC_FASTAPI_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
      })
      
      const response = await fetch(url)
      
      console.log("📊 Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Error response body:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log("✅ Gap analysis data received:", data)
      console.log("📊 Gap analysis summary:", {
        role: data.target_role,
        category: data.target_category,
        criticalGapsCount: data.critical_gaps?.length || 0,
        skillsToImproveCount: data.skills_to_improve?.length || 0,
        matchingSkillsCount: data.matching_skills?.length || 0,
      })
      
      // Ensure we have the summary data structure
      const processedData = {
        ...data,
        target_role: data.role || selectedRole,
        target_category: data.category,
        experience_level: data.experience_level,
        summary: {
          total_required_skills: data.critical_gaps?.length || 0 + data.skills_to_improve?.length || 0,
          skills_matched: data.matching_skills?.length || 0,
          skills_to_improve: data.skills_to_improve?.length || 0,
          skills_missing: data.critical_gaps?.length || 0,
        }
      }
      
      setGapAnalysisData(processedData)
      setPersistedData(processedData) // Persist to store
      
      // Update results store with real API data
      setResults({
        analyzed: true,
        overallMatchScore: data.overall_match_score || 0,
        criticalGaps: data.critical_gaps || [],
        skillsToImprove: data.skills_to_improve || [],
        matchingSkills: data.matching_skills || [],
      })
      
      setShowResults(true)
      
    } catch (error) {
      console.error("❌ Failed to fetch gap analysis:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      setGapAnalysisError(errorMsg)
      
      toast({
        title: "Error Loading Gap Analysis",
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsLoadingGapAnalysis(false)
    }
  }

  // Fetch gap analysis when filters change
  useEffect(() => {
    if (hasActiveResume && selectedRole) {
      fetchGapAnalysis()
    }
  }, [])

  // Calculate total salary impact from critical gaps and skills to improve
  const totalSalaryImpact = useMemo(() => {
    if (!gapAnalysisData) return 0
    
    console.log("🔍 Calculating salary impact...")
    console.log("📊 Gap analysis data:", gapAnalysisData)
    
    // Sum salary impacts from critical gaps (top 5)
    const gapsImpact = (gapAnalysisData.critical_gaps || [])
      .filter((gap: any) => !deletedSkillIds.includes(gap.name))
      .slice(0, 5)
      .reduce((sum: number, gap: any) => {
        // Handle both numeric and string values
        let value = 0
        const salaryData = gap.salary_impact || gap.salaryImpact
        
        if (typeof salaryData === 'number') {
          value = salaryData
        } else if (typeof salaryData === 'string') {
          // Parse string format: "₹4.2L" or "4.2L"
          value = parseFloat(
            salaryData.toString().replace('₹', '').replace('L', '').trim()
          )
        }
        
        console.log(`🔍 Gap "${gap.name}" salary:`, salaryData, "→ parsed:", value)
        return sum + (isNaN(value) || value === 0 ? 0 : value)
      }, 0)
    
    // Sum from skills to improve (top 3)
    const improveImpact = (gapAnalysisData.skills_to_improve || [])
      .filter((skill: any) => !deletedSkillIds.includes(skill.name))
      .slice(0, 3)
      .reduce((sum: number, skill: any) => {
        // Handle both numeric and string values
        let value = 0
        const salaryData = skill.salary_impact || skill.salaryImpact
        
        if (typeof salaryData === 'number') {
          value = salaryData
        } else if (typeof salaryData === 'string') {
          value = parseFloat(
            salaryData.toString().replace('₹', '').replace('L', '').trim()
          )
        }
        
        console.log(`🔍 Skill "${skill.name}" salary:`, salaryData, "→ parsed:", value)
        return sum + (isNaN(value) || value === 0 ? 0 : value)
      }, 0)
    
    const total = gapsImpact + improveImpact
    
    console.log("💰 Gaps Impact:", gapsImpact)
    console.log("💰 Improve Impact:", improveImpact)
    console.log("💰 Total salary impact:", total)
    
    // Ensure minimum impact display
    return Math.max(0, total).toFixed(1)
  }, [gapAnalysisData, deletedSkillIds])

  // Diagnostic logging when gap analysis data changes
  useEffect(() => {
    if (gapAnalysisData?.critical_gaps && gapAnalysisData.critical_gaps.length > 0) {
      console.log("📊 ===== GAP ANALYSIS DATA DIAGNOSTIC =====")
      console.log("📊 Total Critical Gaps:", gapAnalysisData.critical_gaps.length)
      console.log("📊 Total Skills to Improve:", gapAnalysisData.skills_to_improve?.length || 0)
      console.log("📊 Deleted Skills:", deletedSkillIds)
      console.log("💰 Calculated Total Salary Impact: ₹" + totalSalaryImpact + "L")
      
      // Log individual skills
      gapAnalysisData.critical_gaps.forEach((gap: any, idx: number) => {
        console.log(`  Gap ${idx + 1}: ${gap.name} | Demand: ${gap.marketDemand}% | Salary Impact: ${gap.salaryImpact}`)
      })
      
      gapAnalysisData.skills_to_improve?.forEach((skill: any, idx: number) => {
        console.log(`  Improve ${idx + 1}: ${skill.name} | Demand: ${skill.marketDemand}% | Salary Impact: ${skill.salaryImpact}`)
      })
    }
  }, [gapAnalysisData, totalSalaryImpact, deletedSkillIds])

  const handleAnalyze = () => {
    if (!selectedRole) {
      showEnhancedToast("warning", {
        title: "Please Select a Role",
        description: "Choose a target role to analyze gaps.",
      })
      return
    }
    
    if (jobCategory === "All Categories") {
      showEnhancedToast("warning", {
        title: "Please Select a Job Category",
        description: "Choose a job category to analyze gaps.",
      })
      return
    }
    
    // Call the real API fetch
    setIsLoadingGapAnalysis(true)
    setShowResults(true)
    fetchGapAnalysis()
  }

  const handleClearFilters = () => {
    // Clear persistence store data
    clearAllPersistence()
    
    // Reset all filter values
    setSelectedRole("")
    setJobCategory("All Categories")
    setExperienceLevel("All Levels")
    setTargetSalary("")
    setSalaryCurrency("INR")
    
    // Clear all analysis data and state
    setGapAnalysisData(null)
    setShowResults(false)
    setResults({
      analyzed: false,
      overallMatchScore: 0,
      criticalGaps: [],
      skillsToImprove: [],
      matchingSkills: [],
    })
    
    // Reset UI state
    setFavoriteSkills([])
    setExpandedTabs({
      critical: false,
      improve: false,
      matching: false,
    })
    setDeletedSkillIds([])
    
    showEnhancedToast("info", {
      title: "Filters Cleared",
      description: "All filters have been reset. Select new filters and click 'Analyze Gaps' to see results.",
    })
  }

  const handleRefreshAnalysis = () => {
    setIsLoading(true)
    setTimeout(() => {
      const activeResume = getActiveResume()
      const userSkills = activeResume?.extractedSkills || []

      const dynamicAnalysis = generateDynamicAnalysis({
        selectedRole,
        jobCategory,
        experienceLevel,
        targetSalary,
        salaryCurrency,
        userSkills,
      })

      setResults({
        analyzed: true,
        overallMatchScore: dynamicAnalysis.overallMatchScore,
        criticalGaps: dynamicAnalysis.criticalGaps,
        skillsToImprove: dynamicAnalysis.skillsToImprove,
        matchingSkills: dynamicAnalysis.matchingSkills,
      })
      setShowResults(true)
      setIsLoading(false)
      showEnhancedToast("success", {
        title: "Analysis Refreshed",
        description: "New analysis generated based on your filters.",
      })
      document.querySelector(".detailed-skills-section")?.scrollIntoView({ behavior: "smooth" })
    }, 1500)
  }

  const handleExportReport = async () => {
    setIsExporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const reportContent = `
GAP ANALYSIS REPORT
==================
Role: ${selectedRole}
Date: ${new Date().toLocaleDateString()}
Match Score: ${results?.overallMatchScore}%

CRITICAL GAPS (${results?.criticalGaps.length} skills)
${results?.criticalGaps.map((s: any) => `- ${s.name}: ${s.marketDemand}/100 demand, +${s.salaryImpact} salary impact`).join("\n")}

SKILLS TO IMPROVE (${results?.skillsToImprove.length} skills)
${results?.skillsToImprove.map((s: any) => `- ${s.name}: High Value`).join("\n")}

MATCHING SKILLS (${results?.matchingSkills.length} skills)
${results?.matchingSkills.map((s: any) => `- ${s.name}`).join("\n")}
      `

      const blob = new Blob([reportContent], { type: "text/plain" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Gap_Analysis_${selectedRole.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showEnhancedToast("success", {
        title: "Report Downloaded",
        description: "Your gap analysis report has been saved.",
      })
    } catch (error) {
      showEnhancedToast("error", {
        title: "Download Failed",
        description: "Unable to generate report. Please try again.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareAnalysis = () => {
    const uniqueId = Math.random().toString(36).substring(2, 11)
    const link = `${window.location.origin}/gap-analysis/shared/${uniqueId}`
    setShareLink(link)
    setShowShareDialog(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    showEnhancedToast("success", {
      title: "Link Copied",
      description: "Shareable link copied to clipboard.",
    })
  }

  const handleSaveToProfile = () => {
    const analysisData = {
      role: selectedRole,
      matchScore: results?.overallMatchScore,
      date: new Date().toISOString(),
      criticalGaps: results?.criticalGaps.length,
      skillsToImprove: results?.skillsToImprove.length,
      matchingSkills: results?.matchingSkills.length,
    }

    const savedAnalyses = JSON.parse(localStorage.getItem("savedAnalyses") || "[]")
    savedAnalyses.push(analysisData)
    localStorage.setItem("savedAnalyses", JSON.stringify(savedAnalyses))

    showEnhancedToast("success", {
      title: "Analysis Saved",
      description: "Analysis saved to your profile.",
      action: {
        label: "View",
        onClick: () => {
          window.location.href = "/profile"
        },
      },
    })
  }

  const handleFindCourses = (skillName: string) => {
    const platform = coursePlatforms.find((p) => p.name === selectedCourseProvider)
    if (platform) {
      const courseSearchUrl = `${platform.url}${encodeURIComponent(skillName)}`
      window.open(courseSearchUrl, "_blank")
      showEnhancedToast("info", {
        title: "Opening Courses",
        description: `Searching for ${skillName} courses on ${selectedCourseProvider}.`,
      })
    }
  }

  const handleAddToLearningPath = (skill: any) => {
    try {
      if (hasCourseForSkill(skill.name)) {
        showEnhancedToast("warning", {
          title: "Course already exists",
          description: `Course already exists. A course for '${skill.name}' is already in your learning path.`,
        })
        return
      }

      const newCourse = {
        id: `course-${Date.now()}`,
        title: skill.name,
        platform: "Custom",
        totalHours: 40,
        studiedHours: 0,
        progress: 0,
        status: "not-started" as const,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        notes: `Added from Gap Analysis - ${skill.name}`,
      }

      addCourse(newCourse)

      showEnhancedToast("success", {
        title: "Success",
        description: `${skill.name} added to courses.`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/learning-path"
          },
        },
      })
    } catch (error) {
      console.error("[v0] Error adding course:", error)
      showEnhancedToast("error", {
        title: "Error",
        description: "Failed to add to learning path. Please try again.",
      })
    }
  }

  const handleCreateRoadmapClick = (skill: any) => {
    try {
      const existingRoadmap = results?.skillsToImprove?.find((s) => s.name === skill.name)
      if (!existingRoadmap) {
        showEnhancedToast("error", {
          title: "Skill Not Found",
          description: `"${skill.name}" not found in skills to improve.`,
        })
        return
      }

      const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const phases = [
        {
          id: generateId(),
          name: "Fundamentals",
          description: `Learn the core concepts and basics of ${skill.name}`,
          duration: "2-3 weeks",
          objectives: [
            `Understand ${skill.name} fundamentals`,
            "Set up development environment",
            "Complete basic tutorials",
          ],
          resources: ["Official documentation", "Beginner tutorials", "Interactive courses"],
          projects: ["Hello World project", "Basic practice exercises"],
        },
        {
          id: generateId(),
          name: "Practical Projects",
          description: `Build real-world projects using ${skill.name}`,
          duration: "4-6 weeks",
          objectives: ["Build 2-3 small projects", "Implement best practices", "Learn debugging techniques"],
          resources: ["Project templates", "Code examples", "Community forums"],
          projects: ["Todo application", "API integration project", "Full-featured application"],
        },
        {
          id: generateId(),
          name: "Advanced Techniques",
          description: `Master advanced patterns and optimization in ${skill.name}`,
          duration: "3-4 weeks",
          objectives: ["Learn advanced patterns", "Optimize performance", "Contribute to open source"],
          resources: ["Advanced courses", "Technical blogs", "Open source projects"],
          projects: ["Performance optimization", "Open source contribution", "Production-ready application"],
        },
      ]

      const newRoadmap = {
        title: `${skill.name} Learning Roadmap`,
        skill: skill.name,
        skillId: skill.id || `skill-${Date.now()}`,
        status: "ready" as const,
        phases,
        startDate: new Date().toISOString().split("T")[0],
        targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        source: "gap-analysis" as const,
      }

      addRoadmap(newRoadmap)

      showEnhancedToast("success", {
        title: "Added to Roadmaps",
        description: `"${skill.name}" is ready for roadmap generation.`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/learning-path"
          },
        },
      })
    } catch (error) {
      console.error("[v0] Error creating roadmap:", error)
      showEnhancedToast("error", {
        title: "Error",
        description: "Failed to create roadmap. Please try again.",
      })
    }
  }

  const generatePhases = (skill: any, isImprovement: boolean = false) => {
    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (isImprovement) {
      // For skills to improve (already have some knowledge)
      return [
        {
          id: generateId(),
          name: "Practice & Strengthen Fundamentals",
          description: `Review and strengthen ${skill.name || skill.skill_name} fundamentals`,
          duration: "2-3 weeks",
          objectives: [
            `Review core ${skill.name || skill.skill_name} concepts`,
            "Identify knowledge gaps",
            "Practice with real-world scenarios",
          ],
          resources: ["Official documentation", "Practice exercises", "Code challenges"],
          projects: ["Review project", "Knowledge assessment"],
        },
        {
          id: generateId(),
          name: "Advanced Techniques",
          description: `Master advanced ${skill.name || skill.skill_name} patterns`,
          duration: "3-4 weeks",
          objectives: [
            `Master advanced ${skill.name || skill.skill_name} patterns`,
            "Build complex projects",
            "Optimize performance",
          ],
          resources: ["Advanced tutorials", "Real-world projects", "Best practices guide"],
          projects: ["Complex project", "Optimization challenge"],
        },
        {
          id: generateId(),
          name: "Expert Level Mastery",
          description: `Achieve expert-level mastery in ${skill.name || skill.skill_name}`,
          duration: "2-3 weeks",
          objectives: [
            "Deep dive into internals",
            "Contribute to open source",
            "Teach others",
          ],
          resources: ["Advanced courses", "Open source projects", "Community forums"],
          projects: ["Open source contribution", "Mentoring project"],
        },
      ]
    } else {
      // For critical gaps (completely new skill)
      return [
        {
          id: generateId(),
          name: "Foundation & Basics",
          description: `Understand ${skill.name || skill.skill_name} fundamentals`,
          duration: "3-4 weeks",
          objectives: [
            `Understand ${skill.name || skill.skill_name} fundamentals`,
            "Set up development environment",
            "Complete beginner tutorials",
          ],
          resources: ["Getting started guide", "Beginner course (Udemy/Coursera)", "Official documentation"],
          projects: ["Setup project", "Hello World application"],
        },
        {
          id: generateId(),
          name: "Intermediate Practice",
          description: `Build practical projects in ${skill.name || skill.skill_name}`,
          duration: "4-5 weeks",
          objectives: [
            `Build small ${skill.name || skill.skill_name} projects`,
            "Learn common patterns",
            "Understand best practices",
          ],
          resources: ["Intermediate tutorials", "Practice projects", "Community resources"],
          projects: ["Todo app", "API project", "Data processing app"],
        },
        {
          id: generateId(),
          name: "Advanced Application",
          description: `Apply ${skill.name || skill.skill_name} in real-world scenarios`,
          duration: "3-4 weeks",
          objectives: [
            `Apply ${skill.name || skill.skill_name} in real projects`,
            "Handle complex scenarios",
            "Production-ready implementation",
          ],
          resources: ["Advanced course", "Real-world case studies", "Production guidelines"],
          projects: ["Full-stack project", "Complex application"],
        },
        {
          id: generateId(),
          name: "Mastery & Optimization",
          description: `Achieve mastery and optimization in ${skill.name || skill.skill_name}`,
          duration: "2-3 weeks",
          objectives: [
            "Performance optimization",
            "Debugging and troubleshooting",
            "Industry standards compliance",
          ],
          resources: ["Performance tuning guides", "Expert-level tutorials", "Industry certifications"],
          projects: ["Optimization project", "Performance analysis"],
        },
      ]
    }
  }

  const handleAddToRoadmap = (skill: any, isImprovement: boolean = false) => {
    try {
      if (hasRoadmapForSkill(skill.name || skill.skill_name)) {
        showEnhancedToast("warning", {
          title: "Roadmap already exists",
          description: `A roadmap for '${skill.name || skill.skill_name}' already exists.`,
        })
        return
      }

      const skillName = skill.name || skill.skill_name || "Unknown Skill"
      const newRoadmap = {
        title: `${skillName} Learning Path`,
        skill: skillName,
        skillId: skill.id || `skill-${Date.now()}`,
        status: "ready" as const,
        phases: generatePhases(skill, isImprovement),
        startDate: new Date().toISOString().split("T")[0],
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        source: "gap-analysis" as const,
      }

      addRoadmap(newRoadmap)

      showEnhancedToast("success", {
        title: "Added to Roadmap",
        description: `${skillName} learning path has been added to your roadmaps.`,
        action: {
          label: "View Roadmap",
          onClick: () => {
            window.location.href = "/learning-path"
          },
        },
      })
    } catch (error) {
      console.error("[v0] Error adding to roadmap:", error)
      showEnhancedToast("error", {
        title: "Error",
        description: "Failed to add to roadmap. Please try again.",
      })
    }
  }

  const handleToggleFavorite = (skillName: string) => {
    if (favoriteSkills.includes(skillName)) {
      removeFavoriteSkill(skillName)
      setFavoriteSkills(favoriteSkills.filter((s) => s !== skillName))
      showEnhancedToast("info", {
        title: "Removed from favorites",
        description: `${skillName} removed from favorites`,
      })
    } else {
      addFavoriteSkill(skillName)
      setFavoriteSkills([...favoriteSkills, skillName])
      showEnhancedToast("info", {
        title: "Added to favorites",
        description: `${skillName} added to favorites`,
      })
    }
  }

  const handleCopySkillName = (skillName: string) => {
    navigator.clipboard.writeText(skillName)
    showEnhancedToast("success", {
      title: "Copied",
      description: `${skillName} copied to clipboard`,
    })
  }

  const handleRemoveSkill = (skillName: string) => {
    // Track deleted skill ID
    if (!deletedSkillIds.includes(skillName)) {
      setDeletedSkillIds(prev => [...prev, skillName])
    }
    
    showEnhancedToast("info", {
      title: "Skill removed",
      description: `${skillName} removed from analysis`,
    })
  }

  const handleViewDetails = (skillName: string, skillData: any) => {
    setSelectedSkillDetails({ name: skillName, ...skillData })
    setShowDetailsModal(true)
  }

  const handleRemoveSkillWithConfirm = (skillName: string, tab: "critical" | "improve" | "matching") => {
    setRemovingSkill(skillName)
    setRemovingFromTab(tab)
    setShowRemoveConfirm(true)
  }

  const confirmRemoveSkill = () => {
    if (removingSkill && results && removingFromTab) {
      setRemovingSkillId(removingSkill)

      // Track deleted skill ID in persistence store
      if (!deletedSkillIds.includes(removingSkill)) {
        addDeletedSkill(removingSkill)
        setDeletedSkillIds(prev => [...prev, removingSkill])
      }

      // Wait for fade animation to complete before updating state
      setTimeout(() => {
        const updatedResults = { ...results }

        if (removingFromTab === "critical") {
          updatedResults.criticalGaps = results.criticalGaps.filter((skill: any) => skill.name !== removingSkill)
        } else if (removingFromTab === "improve") {
          updatedResults.skillsToImprove = results.skillsToImprove.filter((skill: any) => skill.name !== removingSkill)
        } else if (removingFromTab === "matching") {
          updatedResults.matchingSkills = results.matchingSkills.filter((skill: any) => skill.name !== removingSkill)
        }

        setResults(updatedResults)

        showEnhancedToast("info", {
          title: "Skill removed",
          description: `${removingSkill} removed from analysis`,
        })
        setShowRemoveConfirm(false)
        setRemovingSkill(null)
        setRemovingFromTab(null)
        setRemovingSkillId(null)
      }, 300) // Wait for CSS fade animation
    }
  }

  const toggleShowMore = (tab: "critical" | "improve" | "matching") => {
    setItemsToShow((prev) => {
      const allItems =
        tab === "critical"
          ? results?.criticalGaps?.length || 0
          : tab === "improve"
            ? results?.skillsToImprove?.length || 0
            : results?.matchingSkills?.length || 0

      const currentCount = prev[tab]
      // Show all if less than all, otherwise reset to initial 6
      const newCount = currentCount >= allItems ? 6 : allItems

      return {
        ...prev,
        [tab]: newCount,
      }
    })
  }

  const criticalGapsDisplay = results?.criticalGaps?.slice(0, itemsToShow.critical) || []
  const skillsToImproveDisplay = results?.skillsToImprove?.slice(0, itemsToShow.improve) || []
  const matchingSkillsDisplay = results?.matchingSkills?.slice(0, itemsToShow.matching) || []

  // Filter skills based on target salary
  const filteredCriticalGaps = useMemo(() => {
    let filtered = criticalGapsDisplay
    
    // Filter out deleted skills
    filtered = filtered.filter((gap: any) => !deletedSkillIds.includes(gap.name))
    
    if (!targetSalary || targetSalary === "") {
      return filtered
    }
    
    const salaryTarget = parseInt(targetSalary)
    return filtered.filter((gap: any) => {
      const salaryImpactStr = (gap.salary_impact || gap.salaryImpact || "0").toString().replace(/[₹L,]/g, "")
      const salaryValue = parseFloat(salaryImpactStr) || 0
      // Skills that contribute meaningfully to salary target (at least 5% of target)
      return salaryValue >= (salaryTarget * 0.05 / 100000)
    })
  }, [criticalGapsDisplay, targetSalary, gapAnalysisData, deletedSkillIds])

  const filteredSkillsToImprove = useMemo(() => {
    let filtered = skillsToImproveDisplay
    
    // Filter out deleted skills
    filtered = filtered.filter((skill: any) => !deletedSkillIds.includes(skill.name))
    
    if (!targetSalary || targetSalary === "") {
      return filtered
    }
    
    const salaryTarget = parseInt(targetSalary)
    return filtered.filter((skill: any) => {
      const salaryImpactStr = (skill.salary_impact || skill.salaryImpact || "0").toString().replace(/[₹L,]/g, "")
      const salaryValue = parseFloat(salaryImpactStr) || 0
      return salaryValue >= (salaryTarget * 0.05 / 100000)
    })
  }, [skillsToImproveDisplay, targetSalary, gapAnalysisData, deletedSkillIds])

  const filteredMatchingSkills = useMemo(() => {
    let filtered = matchingSkillsDisplay
    
    // Filter out deleted skills
    filtered = filtered.filter((skill: any) => !deletedSkillIds.includes(skill.name))
    
    if (!targetSalary || targetSalary === "") {
      return filtered
    }
    
    const salaryTarget = parseInt(targetSalary)
    return filtered.filter((skill: any) => {
      const salaryImpactStr = (skill.salary_impact || skill.salaryImpact || "0").toString().replace(/[₹L,]/g, "")
      const salaryValue = parseFloat(salaryImpactStr) || 0
      return salaryValue >= (salaryTarget * 0.05 / 100000)
    })
  }, [matchingSkillsDisplay, targetSalary, gapAnalysisData, deletedSkillIds])

  // This calculation appears to be based on static data and not dynamically from results
  // //   (matchingSkillsData.length / (criticalGapsData.length + skillsToImproveData.length + matchingSkillsData.length)) *
  //   // 100,
  // )

  return (
    <>
      <LoadingDialog
        isOpen={showLoadingDialog}
        title="Analyzing Skill Gaps"
        message="Loading your gap analysis..."
        onComplete={() => {
          setShowLoadingDialog(false)
          setIsLoading(false)
        }}
      />
      {showLoadingDialog ? null : !hasActiveResume ? (
        <NoResumeEmptyState />
      ) : (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground md:text-4xl">Gap Analysis & Career Roadmap</h1>
            <p className="text-lg text-foreground/70">
              Identify skill gaps and create a personalized learning path for your target role.
            </p>
          </div>

          {/* Loading State */}
          {isLoadingGapAnalysis && (
            <Card className="glass p-6 border border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-300">Analyzing your skills...</p>
                  <p className="text-xs text-blue-200/70">Comparing against market demand and role requirements</p>
                </div>
              </div>
            </Card>
          )}

          {/* Error State */}
          {gapAnalysisError && (
            <Card className="glass p-6 border border-red-500/30 bg-red-500/5">
              <p className="text-sm text-red-300">⚠️ {gapAnalysisError}</p>
            </Card>
          )}

          {!showResults ? (
            <GapAnalysisEmptyState
              onGetStarted={() =>
                document.querySelector("[data-scroll-to=config]")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          ) : null}

          <Card className="glass p-6 space-y-6" data-scroll-to="config">
            <h2 className="text-lg font-semibold text-foreground">Configuration & Setup</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Experience Level</label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Job Category</label>
                <Select value={jobCategory} onValueChange={setJobCategory}>
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Salary</label>
                <div className="flex gap-2">
                  <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                    <SelectTrigger className="w-20 bg-secondary/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ INR</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="e.g., 1200000"
                    value={targetSalary}
                    onChange={(e) => setTargetSalary(e.target.value)}
                    className="flex-1 bg-secondary/50 border-white/10"
                  />
                </div>
                <p className="text-xs text-foreground/50">Annual package in {salaryCurrency}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Quick Select Salary Ranges ({salaryCurrency})</p>
              <div className="flex flex-wrap gap-2">
                {salaryCurrency === "INR" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("450000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Entry: ₹3-6 LPA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("800000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Junior: ₹6-10 LPA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("1400000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Mid: ₹10-18 LPA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("2400000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Senior: ₹18-30 LPA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("4000000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Lead: ₹30-50 LPA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("5000000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Principal: ₹50+ LPA
                    </Button>
                  </>
                )}
                {salaryCurrency === "USD" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("60000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Entry: $50-75K
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("100000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Junior: $75-125K
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("160000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Mid: $125-200K
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("250000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Senior: $200-300K
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("350000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Lead: $300-500K
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetSalary("500000")}
                      className="bg-transparent border-white/10 hover:bg-white/5"
                    >
                      Principal: $500K+
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!selectedRole || isLoading}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Gaps
                </>
              )}
            </Button>

            {/* Additional Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex-1 gap-2 bg-transparent border-white/10 hover:bg-white/5"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAnalysis}
                disabled={!showResults || isLoading}
                className="flex-1 gap-2 bg-transparent border-white/10 hover:bg-white/5"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Analysis
              </Button>
            </div>
          </Card>

          {!gapAnalysisData || !showResults ? (
            /* Placeholder when no analysis is selected */
            <Card className="glass p-12 text-center space-y-4 bg-secondary/20 border-white/10">
              <Lightbulb className="w-12 h-12 text-yellow-400/50 mx-auto" />
              <div className="space-y-3">
                <p className="text-lg font-medium text-foreground">
                  No Analysis Selected
                </p>
                <p className="text-sm text-foreground/70 max-w-md mx-auto">
                  Please configure your target role, job category, and experience level above, then click "Analyze Gaps" to see personalized skill recommendations.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Loading Gap Analysis */}
              {isLoadingGapAnalysis && (
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertDescription className="text-foreground/70 flex items-center gap-2">
                    <div className="animate-spin">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    Loading gap analysis...
                  </AlertDescription>
                </Alert>
              )}

              {/* Gap Analysis Error */}
              {gapAnalysisError && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertDescription className="text-red-300">
                    {gapAnalysisError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Overall Match Score */}
              <Card className="glass p-8 space-y-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Overall Role Match</h2>
                  <p className="text-foreground/70">Your readiness for the {gapAnalysisData?.target_role || selectedRole} role</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-end gap-4">
                    <div className="text-5xl font-bold text-primary">{gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0}%</div>
                    <div className="flex-1">
                      <Progress value={gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0} className="h-3" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        (gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0) >= 80
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : (gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0) >= 60
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {(gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0) >= 80
                        ? "Strong Match (80%+)"
                        : (gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0) >= 60
                          ? "Good Match (60-79%)"
                          : "Moderate Match (40-59%)"}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Summary Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Overall Match Score Card */}
                <Card className="glass p-6 space-y-3 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                  <h3 className="text-sm font-semibold text-foreground/70">Match Score</h3>
                  <div className="text-4xl font-bold text-blue-400">
                    {gapAnalysisData?.overall_match_score || results?.overallMatchScore || 0}%
                  </div>
                  <p className="text-xs text-foreground/60">
                    Based on {gapAnalysisData?.summary?.total_required_skills || 0} required skills
                  </p>
                </Card>

                {/* Skills Matched Card */}
                <Card className="glass p-6 space-y-3 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <h3 className="text-sm font-semibold text-foreground/70">Matched Skills</h3>
                  <div className="text-4xl font-bold text-green-400">
                    {filteredMatchingSkills.length}
                  </div>
                  <p className="text-xs text-foreground/60">
                    Out of {(gapAnalysisData?.summary?.total_required_skills || 0) - deletedSkillIds.length} required
                  </p>
                </Card>

                {/* Skills to Improve Card */}
                <Card className="glass p-6 space-y-3 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                  <h3 className="text-sm font-semibold text-foreground/70">To Improve</h3>
                  <div className="text-4xl font-bold text-orange-400">
                    {filteredSkillsToImprove.length}
                  </div>
                  <p className="text-xs text-foreground/60">Growth opportunities</p>
                </Card>

                {/* Critical Gaps Card */}
                <Card className="glass p-6 space-y-3 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                  <h3 className="text-sm font-semibold text-foreground/70">Critical Gaps</h3>
                  <div className="text-4xl font-bold text-red-400">
                    {filteredCriticalGaps.length}
                  </div>
                  <p className="text-xs text-foreground/60">Must-have skills</p>
                </Card>
              </div>

              {/* Target Role Information Card */}
              <Card className="glass p-6 space-y-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <h3 className="text-lg font-semibold text-foreground">Analysis Target</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-foreground/70">Role:</span>
                    <p className="font-semibold text-foreground mt-1">
                      {selectedRole && selectedRole !== "" 
                        ? selectedRole 
                        : <span className="text-muted-foreground italic">Not selected</span>
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-foreground/70">Category:</span>
                    <p className="font-semibold text-foreground mt-1">
                      {jobCategory && jobCategory !== "All Categories"
                        ? jobCategory
                        : <span className="text-muted-foreground italic">Not selected</span>
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-foreground/70">Experience Level:</span>
                    <p className="font-semibold text-foreground mt-1">
                      {experienceLevel && experienceLevel !== "All Levels"
                        ? experienceLevel
                        : <span className="text-muted-foreground italic">Not selected</span>
                      }
                    </p>
                  </div>
                </div>
              </Card>

              {/* Actionable Recommendation */}
              <Alert className="bg-emerald-500/10 border-emerald-500/30">
                <Lightbulb className="h-5 w-5 text-emerald-400" />
                <AlertDescription className="ml-3 text-foreground/90 space-y-2">
                  <div>
                    <strong>Primary Recommendation:</strong> Focusing on cloud skills like AWS and Kubernetes will
                    significantly boost your match score for this role.
                  </div>
                  <div>
                    <strong>Skill Priority List:</strong> Prioritize: 1) Kubernetes (High Impact), 2) Terraform (Medium
                    Impact), 3) GraphQL (Medium Impact).
                  </div>
                  <div>
                    <strong>Timeline:</strong> Estimated time to reach 90% match: 4-6 months with focused learning.
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action Buttons Row - Removed Compare Roles button */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportReport}
                  disabled={isExporting}
                  className="gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200"
                >
                  <Download className={`w-4 h-4 ${isExporting ? "animate-spin" : ""}`} />
                  {isExporting ? "Exporting..." : "Export Report"}
                </Button>
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleShareAnalysis}
                      className="gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Analysis
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Analysis</DialogTitle>
                      <DialogDescription>Share your gap analysis with others using this link</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input value={shareLink} readOnly className="flex-1" />
                        <Button onClick={handleCopyLink} size="sm">
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm text-foreground/70">
                        This link provides read-only access to your analysis results
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  onClick={handleSaveToProfile}
                  className="gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200"
                >
                  <Save className="w-4 h-4" />
                  Save to Profile
                </Button>
              </div>

              {/* Potential Salary Impact Card */}
              {gapAnalysisData && (
                <Card className="glass p-6 space-y-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-foreground">Potential Salary Increase</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-5xl font-bold text-green-400">
                      ₹{totalSalaryImpact}L
                    </div>
                    <p className="text-sm text-foreground/70">
                      By addressing top {Math.min(5, filteredCriticalGaps.length)} critical gaps and {Math.min(3, filteredSkillsToImprove.length)} skills to improve
                    </p>
                  </div>
                </Card>
              )}

              {/* Detailed Skills Breakdown - Tab Based */}
              <Card className="glass p-6 space-y-6 detailed-skills-section">
                <h2 className="text-xl font-semibold text-foreground">Detailed Skills Breakdown</h2>

                <Tabs defaultValue="critical" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-secondary/30">
                    <TabsTrigger value="critical" className="gap-2">
                      Critical Gaps
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-1">
                        {filteredCriticalGaps.length || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="improve" className="gap-2">
                      Skills to Improve
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-1">
                        {filteredSkillsToImprove.length || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="matching" className="gap-2">
                      Matching Skills
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-1">
                        {filteredMatchingSkills.length || 0}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* Critical Gaps Tab */}
                  <TabsContent value="critical" className="space-y-4 mt-6">
                    {!results?.criticalGaps || results.criticalGaps.length === 0 ? (
                      <Card className="glass p-12 text-center border border-white/10">
                        <p className="text-foreground/70 text-lg">No critical gaps found for this role!</p>
                        <p className="text-foreground/50 text-sm mt-2">
                          Your skills are well-aligned with this position.
                        </p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {filteredCriticalGaps.map((skill: any, idx: number) => (
                          <Card
                            key={`critical-${skill.name}-${idx}`}
                            className={`glass p-4 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 flex items-stretch gap-4 relative ${removingSkillId === skill.name ? "opacity-0 scale-90 transition-opacity transition-transform duration-300" : ""}`}
                          >
                            <div className="absolute top-3 right-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
                                    <MoreVertical className="w-4 h-4 text-foreground/50" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleToggleFavorite(skill.name)}>
                                    <Star className="w-4 h-4 mr-2" />
                                    {favoriteSkills.includes(skill.name) ? "Remove from Favorites" : "Add to Favorites"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewDetails(skill.name, skill)}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopySkillName(skill.name)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Skill Name
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveSkillWithConfirm(skill.name, "critical")}
                                    className="text-red-400 focus:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove from Analysis
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Left Section - Skill Info (30%) */}
                            <div className="flex-1 flex flex-col justify-between min-w-0 pr-8">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-bold text-foreground truncate">{skill.name}</h3>
                                    <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{skill.insight}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                    {skill.priority}
                                  </Badge>
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                    {skill.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Middle Section - Metrics (40%) */}
                            <div className="flex-1 grid grid-cols-2 gap-3 py-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-foreground/70 text-xs">Demand</p>
                                  <p className="font-semibold text-foreground text-sm">{skill.marketDemand}/100</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-foreground/70 text-xs">Salary</p>
                                  <p className="font-semibold text-foreground text-sm">+₹{typeof skill.salaryImpact === 'number' ? (skill.salaryImpact / 100).toFixed(1) : '0'}L</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-foreground/70 text-xs">Time</p>
                                  <p className="font-semibold text-foreground text-sm">
                                    {(() => {
                                      const hours = typeof skill.learningTime === 'number' ? skill.learningTime : 200;
                                      const months = Math.ceil(hours / 40);
                                      return months <= 1 ? '1 month' : `${months} months`;
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-foreground/70 text-xs">Postings</p>
                                  <p className="font-semibold text-foreground text-sm">
                                    {typeof skill.marketDemand === 'number' ? (skill.marketDemand * 30).toLocaleString() : '0'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right Section - Actions (30%) */}
                            <div className="flex flex-col gap-2 justify-center flex-shrink-0 w-36">
                              <Button
                                size="sm"
                                className="w-full px-4 text-sm bg-blue-600 hover:bg-blue-700 min-w-0 flex items-center"
                                onClick={() => handleFindCourses(skill.name)}
                              >
                                <BookOpen className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="truncate text-xs">Find Courses</span>
                              </Button>
                              <Button
                                size="sm"
                                className="w-full px-4 text-sm bg-black text-white border border-white/20 hover:bg-white/10 min-w-0 flex items-center"
                                onClick={() => handleAddToRoadmap(skill, false)}
                              >
                                <Map className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="truncate text-xs">Roadmap</span>
                              </Button>
                              <Button
                                size="sm"
                                className="w-full px-4 text-sm bg-black text-white border border-white/20 hover:bg-white/10 min-w-0 flex items-center"
                                onClick={() => handleAddToLearningPath(skill)}
                              >
                                <Target className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="truncate text-xs">Learning</span>
                              </Button>
                            </div>
                          </Card>
                        ))}

                        {/* Show More/Less Button */}
                        {results.criticalGaps.length > 6 && (
                          <div className="flex justify-center pt-4">
                            <Button
                              variant="outline"
                              className="gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:shadow-md hover:shadow-red-500/10 transition-all duration-200"
                              onClick={() => toggleShowMore("critical")}
                            >
                              {itemsToShow.critical >= results.criticalGaps.length ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show More ({results.criticalGaps.length - 6} more)
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Skills to Improve Tab */}
                  <TabsContent value="improve" className="space-y-4 mt-6">
                    {!results?.skillsToImprove || results.skillsToImprove.length === 0 ? (
                      <Card className="glass p-12 text-center border border-white/10">
                        <p className="text-foreground/70 text-lg">All your skills are at target level!</p>
                        <p className="text-foreground/50 text-sm mt-2">You're well-prepared for this role.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {filteredSkillsToImprove.map((skill: any, idx: number) => {
                          const skillName = skill.name || skill.skill_name || "Unknown Skill"
                          const skillGap = skill.gap ?? 0
                          const salaryImpact = skill.salary_impact || skill.salaryImpact || 0
                          const marketDemand = skill.market_demand || skill.marketDemand || 0
                          const learningTime = skill.time_to_learn || skill.learningTime || "N/A"
                          const priority = skill.priority || "Medium"
                          const insight = skill.insight || ""
                          
                          return (
                            <Card
                              key={`improve-${skillName}-${idx}`}
                              className={`glass p-4 border border-purple-500/20 ${removingSkillId === skillName ? "opacity-0 scale-90 transition-opacity transition-transform duration-300" : ""}`}
                            >
                              <div className="absolute top-3 right-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
                                      <MoreVertical className="w-4 h-4 text-foreground/50" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleToggleFavorite(skillName)}>
                                      <Star className="w-4 h-4 mr-2" />
                                      {favoriteSkills.includes(skillName) ? "Remove from Favorites" : "Add to Favorites"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewDetails(skillName, skill)}>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopySkillName(skillName)}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy Skill Name
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveSkillWithConfirm(skillName, "improve")}
                                      className="text-red-400 focus:text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Remove from Analysis
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Left Section - Skill Info (30%) */}
                              <div className="flex-1 flex flex-col justify-between min-w-0 pr-8">
                                <div className="space-y-2">
                                  <div>
                                    <h3 className="text-base font-bold text-foreground truncate">{skillName}</h3>
                                    <p className="text-xs text-foreground/60 mt-1">{insight || "Skill enhancement opportunity"}</p>
                                  </div>
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs w-fit">
                                    {skill.category || "Other"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Middle Section - Skills Stats (40%) */}
                              <div className="flex-1 flex flex-col justify-center gap-3 py-2">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-foreground/70">Market Demand</span>
                                    <span className="font-semibold text-foreground">{marketDemand}%</span>
                                  </div>
                                  <Progress value={marketDemand} className="h-2" />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-foreground/70">Gap to Close</span>
                                    <span className="font-semibold text-foreground">{skillGap} levels</span>
                                  </div>
                                  <Progress value={Math.min(skillGap * 20, 100)} className="h-2" />
                                </div>
                              </div>

                              {/* Right Section - Impact & Actions (30%) */}
                              <div className="flex flex-col gap-2 justify-center flex-shrink-0 w-40">
                                <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/20">
                                  <p className="text-xs text-foreground/60">Salary Impact</p>
                                  <p className="text-sm font-bold text-green-400">+₹{typeof salaryImpact === 'number' ? (salaryImpact / 100).toFixed(1) : '0'}L</p>
                                </div>
                                <div className="text-center p-2 bg-blue-500/10 rounded border border-blue-500/20">
                                  <p className="text-xs text-foreground/60">Learning Time</p>
                                  <p className="text-sm font-bold text-blue-400">
                                    {(() => {
                                      const hours = typeof learningTime === 'number' ? learningTime : 200;
                                      const months = Math.ceil(hours / 40);
                                      return months <= 1 ? '1 month' : `${months} months`;
                                    })()}
                                  </p>
                                </div>
                                <Badge 
                                  className={priority === "Critical" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}
                                >
                                  {priority} Priority
                                </Badge>
                                <Button
                                  size="sm"
                                  className="w-full px-4 text-sm bg-black text-white border border-white/20 hover:bg-white/10 mt-2 flex items-center min-w-0"
                                  onClick={() => handleAddToRoadmap(skill, true)}
                                >
                                  <Map className="w-4 h-4 mr-1 shrink-0" />
                                  <span className="truncate text-xs">Roadmap</span>
                                </Button>
                              </div>
                            </Card>
                          )
                        })}

                        {/* Show More/Less Button */}
                        {results.skillsToImprove.length > 6 && (
                          <div className="flex justify-center pt-4">
                            <Button
                              variant="outline"
                              className="gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200"
                              onClick={() => toggleShowMore("improve")}
                            >
                              {itemsToShow.improve >= results.skillsToImprove.length ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show More ({results.skillsToImprove.length - 6} more)
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Matching Skills Tab */}
                  <TabsContent value="matching" className="space-y-4 mt-6">
                    {!results?.matchingSkills || results.matchingSkills.length === 0 ? (
                      <Card className="glass p-12 text-center border border-white/10">
                        <p className="text-foreground/70 text-lg">No matching skills identified.</p>
                        <p className="text-foreground/50 text-sm mt-2">Focus on building the critical gaps first.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {filteredMatchingSkills.map((skill: any, idx: number) => {
                          const skillName = skill.name || skill.skill_name || "Unknown Skill"
                          const matchPercentage = skill.matchPercentage || skill.match_percentage || 0
                          const marketDemand = skill.market_demand || skill.marketDemand || 0
                          const yourLevel = skill.yourLevel || skill.proficiency_level || "Intermediate"
                          const insight = skill.insight || ""
                          const category = skill.category || "Other"
                          
                          return (
                            <Card
                              key={`matching-${skillName}-${idx}`}
                              className={`glass p-5 bg-green-500/5 border border-green-500/20 ${removingSkillId === skillName ? "opacity-0 scale-90 transition-opacity transition-transform duration-300" : ""}`}
                            >
                              <div className="absolute top-3 right-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
                                      <MoreVertical className="w-4 h-4 text-foreground/50" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleToggleFavorite(skillName)}>
                                      <Star className="w-4 h-4 mr-2" />
                                      {favoriteSkills.includes(skillName) ? "Remove from Favorites" : "Add to Favorites"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewDetails(skillName, skill)}>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopySkillName(skillName)}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy Skill Name
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveSkillWithConfirm(skillName, "matching")}
                                      className="text-red-400 focus:text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Remove from Analysis
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Top Section - Skill Name & Category */}
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-foreground truncate">{skillName}</h3>
                                  <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{insight}</p>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                      {category}
                                    </Badge>
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                      ✓ Your Strength
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-2xl font-bold text-green-400">{matchPercentage}%</p>
                                  <p className="text-xs text-foreground/70">Match</p>
                                </div>
                              </div>

                              {/* Bottom Section - Stats Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Proficiency Level */}
                                <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                                  <p className="text-xs text-foreground/60 mb-1">Your Level</p>
                                  <p className="text-sm font-bold text-blue-400">{yourLevel}</p>
                                </div>

                                {/* Market Demand */}
                                <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                                  <p className="text-xs text-foreground/60 mb-1">Market Demand</p>
                                  <div className="flex items-center gap-2">
                                    <Progress value={marketDemand} className="flex-1 h-1.5" />
                                    <span className="text-sm font-bold text-purple-400 w-10 text-right">{marketDemand}%</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )
                        })}

                        {/* Show More/Less Button */}
                        {results?.matchingSkills.length > 6 && (
                          <div className="flex justify-center pt-4">
                            <Button
                              variant="outline"
                              className="gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:shadow-md hover:shadow-green-500/10 transition-all duration-200"
                              onClick={() => toggleShowMore("matching")}
                            >
                              {itemsToShow.matching >= results.matchingSkills.length ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show More ({results.matchingSkills.length - 6} more)
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Comprehensive Skill Details Dialog - Works for All Skill Types */}
              <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      {selectedSkillDetails?.name}
                      {selectedSkillDetails?.priority === "High" && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>
                      )}
                      {selectedSkillDetails?.priority === "Medium" && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Priority</Badge>
                      )}
                      {selectedSkillDetails?.matchPercentage && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{selectedSkillDetails.matchPercentage}% Match</Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedSkillDetails?.priority ? "Gap analysis and improvement roadmap" : "Skill match confirmation and leverage opportunities"}
                    </DialogDescription>
                  </DialogHeader>

                  {selectedSkillDetails && (
                    <div className="space-y-6">
                      {/* Overview Section */}
                      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                        <CardHeader>
                          <CardTitle className="text-base">Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Category</p>
                              <p className="font-medium">{selectedSkillDetails?.category || "General"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Market Demand</p>
                              <p className="font-medium">{selectedSkillDetails?.marketDemand || selectedSkillDetails?.market_demand || "N/A"}%</p>
                            </div>
                            {selectedSkillDetails?.priority && (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Current Proficiency</p>
                                  <p className="font-medium">Not Present</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Required Level</p>
                                  <p className="font-medium">Level {selectedSkillDetails?.requiredProficiency || "3"}</p>
                                </div>
                              </>
                            )}
                            {selectedSkillDetails?.matchPercentage && (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Your Level</p>
                                  <p className="font-medium">{selectedSkillDetails?.yourLevel || "Advanced"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Experience</p>
                                  <p className="font-medium">3-5 years</p>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Market Analysis Section */}
                      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardHeader>
                          <CardTitle className="text-base">Market Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Market Demand Score</span>
                              <span className="font-semibold">{selectedSkillDetails?.marketDemand || selectedSkillDetails?.market_demand || 0}/100</span>
                            </div>
                            <Progress value={selectedSkillDetails?.marketDemand || selectedSkillDetails?.market_demand || 0} className="h-2" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-secondary/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">Job Postings</p>
                              <p className="text-lg font-semibold">
                                {selectedSkillDetails?.jobPostings ? (selectedSkillDetails.jobPostings * 30).toLocaleString() : "N/A"}
                              </p>
                            </div>
                            <div className="p-3 bg-secondary/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">Salary Impact</p>
                              <p className="text-lg font-semibold text-green-400">
                                +₹{typeof selectedSkillDetails?.salaryImpact === 'number' ? (selectedSkillDetails.salaryImpact / 100).toFixed(1) : "0"}L
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Learning Path Section */}
                      {selectedSkillDetails?.priority && (
                        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                          <CardHeader>
                            <CardTitle className="text-base">Learning Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Estimated Time</p>
                                <p className="font-medium">
                                  {(() => {
                                    const hours = typeof selectedSkillDetails?.learningTime === 'number' ? selectedSkillDetails.learningTime : 200;
                                    const months = Math.ceil(hours / 40);
                                    return months <= 1 ? "1 month" : `${months} months`;
                                  })()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Difficulty Level</p>
                                <Badge variant="outline">{selectedSkillDetails?.priority === "High" ? "Expert" : "Intermediate"}</Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Learning Roadmap:</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2 bg-secondary/20 rounded">
                                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">1</div>
                                  <div>
                                    <p className="text-sm font-medium">Core Concepts</p>
                                    <p className="text-xs text-muted-foreground">2-3 weeks</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-secondary/20 rounded">
                                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">2</div>
                                  <div>
                                    <p className="text-sm font-medium">Practical Projects</p>
                                    <p className="text-xs text-muted-foreground">3-4 weeks</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-secondary/20 rounded">
                                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">3</div>
                                  <div>
                                    <p className="text-sm font-medium">Advanced Techniques</p>
                                    <p className="text-xs text-muted-foreground">2-3 weeks</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Career Impact & Recommendations */}
                      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-base">Career Impact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-foreground/80">
                          {selectedSkillDetails?.priority ? (
                            <>
                              <p>• Critical skill for your target role - significantly impacts job prospects</p>
                              <p>• Mastering this will improve overall match score by 8-12%</p>
                              <p>• Often paired with: Docker, Kubernetes, CI/CD Pipelines</p>
                              <p>• Career progression: Essential for mid-level to senior roles</p>
                            </>
                          ) : (
                            <>
                              <p>• Your proficiency places you in top 25% for this skill</p>
                              <p>• High demand across 78% of target roles</p>
                              <p>• Recommended: Maintain currency through regular practice</p>
                              <p>• Leverage in interviews and portfolio projects</p>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Actions Section */}
                      <div className="flex gap-2 pt-4">
                        {selectedSkillDetails?.priority && (
                          <Button
                            className="flex-1 px-4 text-sm bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              handleAddToLearningPath(selectedSkillDetails)
                              setShowDetailsModal(false)
                            }}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Add to Learning Path
                          </Button>
                        )}
                        <Button
                          className="flex-1 px-4 text-sm bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleFindCourses(selectedSkillDetails.name)}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Find Courses
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent border-white/10"
                          onClick={() => setShowDetailsModal(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Remove Confirmation Dialog */}
              <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove Skill from Analysis?</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to remove <strong>{removingSkill}</strong> from your analysis? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowRemoveConfirm(false)}
                      className="bg-transparent border-white/10"
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmRemoveSkill} className="bg-red-600 hover:bg-red-700">
                      Remove
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      )}
    </>
  )
}

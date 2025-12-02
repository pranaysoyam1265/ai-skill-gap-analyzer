"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSearchStore } from "@/lib/stores/search-store"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { Plus, Pencil, Trash2, Upload, UploadCloud, Lightbulb, TrendingUp } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingDialog } from "@/components/loading-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useResumeStore } from "@/lib/stores/resume-store"
import { useLearningPathStore } from "@/lib/stores/learning-path-store"
import { ActiveResumeIndicator } from "@/components/active-resume-indicator"
import { useSkillsStore } from "@/lib/stores/skills-store" // Import useSkillsStore
import { getCandidateDetails, type CandidateDetailsResponse } from "@/lib/api/fastapi-client"

// Realistic fallback mock skills for demo/offline mode (reduced from 30 to 7)
const initialMockSkills = [
  {
    id: "1",
    name: "React",
    category: "Frontend",
    proficiency: 4.5,
    confidence: 0.92,
    extractionMethod: "Demo Mode",
    marketDemand: 92,
    trend: "up" as const,
    recommendation: "High demand skill - maintain and expand proficiency",
    jobRoles: ["Frontend Developer", "Full Stack"],
    jobLevels: ["Mid-Level", "Senior"],
  },
  {
    id: "2",
    name: "Python",
    category: "Language",
    proficiency: 3.5,
    confidence: 0.85,
    extractionMethod: "Demo Mode",
    marketDemand: 88,
    trend: "up" as const,
    recommendation: "Versatile language - excellent for backend and data science",
    jobRoles: ["Backend Developer", "Data Scientist"],
    jobLevels: ["Mid-Level"],
  },
  {
    id: "3",
    name: "JavaScript",
    category: "Language",
    proficiency: 4.2,
    confidence: 0.90,
    extractionMethod: "Demo Mode",
    marketDemand: 95,
    trend: "stable" as const,
    recommendation: "Essential web development skill",
    jobRoles: ["Frontend Developer", "Full Stack"],
    jobLevels: ["Mid-Level", "Senior"],
  },
  {
    id: "4",
    name: "SQL",
    category: "Database",
    proficiency: 3.8,
    confidence: 0.88,
    extractionMethod: "Demo Mode",
    marketDemand: 91,
    trend: "stable" as const,
    recommendation: "Critical database skill for most roles",
    jobRoles: ["Backend Developer", "Data Analyst"],
    jobLevels: ["Mid-Level", "Senior"],
  },
  {
    id: "5",
    name: "Git",
    category: "Tools",
    proficiency: 4.0,
    confidence: 0.95,
    extractionMethod: "Demo Mode",
    marketDemand: 98,
    trend: "stable" as const,
    recommendation: "Essential version control - industry standard",
    jobRoles: ["Software Engineer", "DevOps Engineer"],
    jobLevels: ["Entry-Level", "Mid-Level", "Senior"],
  },
  {
    id: "6",
    name: "Docker",
    category: "DevOps",
    proficiency: 3.2,
    confidence: 0.80,
    extractionMethod: "Demo Mode",
    marketDemand: 85,
    trend: "up" as const,
    recommendation: "Important containerization skill for modern development",
    jobRoles: ["DevOps Engineer", "Backend Developer"],
    jobLevels: ["Mid-Level", "Senior"],
  },
  {
    id: "7",
    name: "REST APIs",
    category: "Backend",
    proficiency: 4.1,
    confidence: 0.87,
    extractionMethod: "Demo Mode",
    marketDemand: 89,
    trend: "stable" as const,
    recommendation: "Core backend skill for API development",
    jobRoles: ["Backend Developer", "Full Stack"],
    jobLevels: ["Mid-Level", "Senior"],
  },
]

const SKILL_CATEGORIES = [
  "Programming Languages",
  "Frontend Development",
  "Backend Development",
  "Database Management",
  "Cloud & DevOps",
  "AI & Machine Learning",
  "Mobile Development",
  "Testing & QA",
  "Security",
  "Data Science",
  "Networking",
  "Soft Skills",
  "Tools & Technologies",
] as const

const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const

const LAST_USED_OPTIONS = [
  "Currently Using",
  "Less than 6 months ago",
  "6-12 months ago",
  "1-2 years ago",
  "Over 2 years ago",
] as const

const LEARNING_SOURCES = [
  "University/College",
  "Online Course",
  "Self-Taught",
  "On-the-Job Training",
  "Bootcamp",
  "Certification Program",
  "Personal Projects",
] as const

const PROFICIENCY_SCORE_BY_LEVEL: Record<string, number> = {
  Beginner: 2,
  Intermediate: 3,
  Advanced: 4,
  Expert: 5,
}

type SkillRecord = (typeof initialMockSkills)[number] & Record<string, unknown>
type SkillFormState = {
  name: string
  category: (typeof SKILL_CATEGORIES)[number]
  proficiencyLevel: (typeof PROFICIENCY_LEVELS)[number]
  proficiencyScore: number
  marketDemand: number
  yearsOfExperience: number
  lastUsed: (typeof LAST_USED_OPTIONS)[number]
  certificationAvailable: boolean
  projectCount: number
  learningSource: (typeof LEARNING_SOURCES)[number]
  endorsements: number
  notes: string
}

type SkillList = typeof initialMockSkills

const createEmptySkillForm = (): SkillFormState => ({
  name: "",
  category: SKILL_CATEGORIES[0],
  proficiencyLevel: "Intermediate",
  proficiencyScore: PROFICIENCY_SCORE_BY_LEVEL.Intermediate,
  marketDemand: 50,
  yearsOfExperience: 0,
  lastUsed: LAST_USED_OPTIONS[0],
  certificationAvailable: false,
  projectCount: 0,
  learningSource: LEARNING_SOURCES[0],
  endorsements: 0,
  notes: "",
})

const mapLevelToScore = (level: (typeof PROFICIENCY_LEVELS)[number]): number =>
  PROFICIENCY_SCORE_BY_LEVEL[level] ?? PROFICIENCY_SCORE_BY_LEVEL.Intermediate

const mapScoreToLevel = (score: number): (typeof PROFICIENCY_LEVELS)[number] => {
  if (score >= 4.5) return "Expert"
  if (score >= 3.5) return "Advanced"
  if (score >= 2.5) return "Intermediate"
  return "Beginner"
}

const generateRecommendation = (
  proficiency: (typeof PROFICIENCY_LEVELS)[number],
  skillName: string,
): string => {
  switch (proficiency) {
    case "Expert":
      return `Strong mastery of ${skillName}. Consider mentoring others or contributing to open source.`
    case "Advanced":
      return `Solid ${skillName} skills. Focus on advanced patterns and best practices.`
    case "Intermediate":
      return `Build practical ${skillName} projects to reach advanced level.`
    default:
      return `Start with ${skillName} fundamentals and build small projects.`
  }
}

const getJobRolesForCategory = (category: string): string[] => {
  const roleMap: Record<string, string[]> = {
    Frontend: ["Frontend Developer", "React Developer", "UI Engineer"],
    Backend: ["Backend Developer", "API Developer", "System Architect"],
    Language: ["Software Engineer", "Full Stack Developer"],
    DevOps: ["DevOps Engineer", "Cloud Engineer", "SRE"],
    Database: ["Database Administrator", "Data Engineer"],
    Cloud: ["Cloud Architect", "Cloud Engineer"],
    "ML/AI": ["ML Engineer", "Data Scientist", "AI Researcher"],
    Tools: ["Software Engineer", "DevOps Engineer"],
    "Soft Skill": ["Team Lead", "Project Manager"],
    Security: ["Security Engineer", "Penetration Tester"],
    Testing: ["QA Engineer", "Automation Test Engineer"],
    Product: ["Product Manager", "Product Owner"],
    Design: ["UI/UX Designer", "Product Designer"],
  }

  return roleMap[category] ?? ["Software Engineer"]
}

const getJobLevelsForProficiency = (proficiency: (typeof PROFICIENCY_LEVELS)[number]): string[] => {
  switch (proficiency) {
    case "Expert":
      return ["Senior", "Lead", "Staff"]
    case "Advanced":
      return ["Mid-Level", "Senior"]
    case "Beginner":
      return ["Intern", "Junior"]
    default:
      return ["Junior", "Mid-Level"]
  }
}

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const safeParseInt = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const buildSkillFromForm = (form: SkillFormState, base?: SkillRecord): SkillRecord => {
  const existing = base ?? ({} as SkillRecord)
  const trimmedName = form.name.trim()
  const proficiencyScore = clampNumber(form.proficiencyScore, 1, 5)
  const proficiencyLevel = mapScoreToLevel(proficiencyScore)
  const marketDemand = clampNumber(form.marketDemand, 0, 100)
  const name = trimmedName || (existing.name as string) || "New Skill"

  return {
    ...existing,
    id: existing.id ?? createManualSkillId(),
    name,
    category: form.category,
    proficiency: proficiencyScore,
    marketDemand,
    trend: existing.trend ?? "stable",
    confidence: existing.confidence ?? 0.8,
    extractionMethod: existing.extractionMethod ?? "Manual Entry",
    recommendation: generateRecommendation(proficiencyLevel, name),
    jobRoles: getJobRolesForCategory(form.category),
    jobLevels: getJobLevelsForProficiency(proficiencyLevel),
    yearsOfExperience: form.yearsOfExperience,
    lastUsed: form.lastUsed,
    projectCount: form.projectCount,
    learningSource: form.learningSource,
    endorsements: form.endorsements,
    notes: form.notes,
    certificationAvailable: form.certificationAvailable,
    proficiencyLevel,
    proficiencyScore,
  } as SkillRecord
}

const isSkillCategory = (value: string): value is (typeof SKILL_CATEGORIES)[number] =>
  SKILL_CATEGORIES.includes(value as (typeof SKILL_CATEGORIES)[number])

const isProficiencyLevel = (value: string): value is (typeof PROFICIENCY_LEVELS)[number] =>
  PROFICIENCY_LEVELS.includes(value as (typeof PROFICIENCY_LEVELS)[number])

const isLastUsedOption = (value: string): value is (typeof LAST_USED_OPTIONS)[number] =>
  LAST_USED_OPTIONS.includes(value as (typeof LAST_USED_OPTIONS)[number])

const isLearningSource = (value: string): value is (typeof LEARNING_SOURCES)[number] =>
  LEARNING_SOURCES.includes(value as (typeof LEARNING_SOURCES)[number])

const ensureCategory = (value?: string): (typeof SKILL_CATEGORIES)[number] =>
  value && isSkillCategory(value) ? value : SKILL_CATEGORIES[0]

const ensureLastUsed = (value?: string): (typeof LAST_USED_OPTIONS)[number] =>
  value && isLastUsedOption(value) ? value : LAST_USED_OPTIONS[0]

const ensureLearningSource = (value?: string): (typeof LEARNING_SOURCES)[number] =>
  value && isLearningSource(value) ? value : LEARNING_SOURCES[0]

const ensureProficiencyLevel = (value?: string, score?: number): (typeof PROFICIENCY_LEVELS)[number] => {
  if (value && isProficiencyLevel(value)) return value
  if (typeof score === "number") return mapScoreToLevel(score)
  return "Intermediate"
}

const buildFormFromSkill = (skill: SkillRecord): SkillFormState => {
  const skillAny = skill as Record<string, unknown>
  const proficiencyScore = clampNumber(typeof skill.proficiency === "number" ? skill.proficiency : 3, 1, 5)
  const yearsOfExperience =
    typeof skillAny.yearsOfExperience === "number" ? skillAny.yearsOfExperience : 0
  const projectCount = typeof skillAny.projectCount === "number" ? skillAny.projectCount : 0
  const endorsements = typeof skillAny.endorsements === "number" ? skillAny.endorsements : 0

  return {
    name: typeof skill.name === "string" ? skill.name : "",
    category: ensureCategory(typeof skill.category === "string" ? skill.category : undefined),
    proficiencyLevel: ensureProficiencyLevel(skillAny.proficiencyLevel as string | undefined, proficiencyScore),
    proficiencyScore,
    marketDemand: clampNumber(
      typeof skillAny.marketDemand === "number" ? skillAny.marketDemand : 50,
      0,
      100,
    ),
    yearsOfExperience,
    lastUsed: ensureLastUsed(skillAny.lastUsed as string | undefined),
    certificationAvailable: Boolean(skillAny.certificationAvailable),
    projectCount,
    learningSource: ensureLearningSource(skillAny.learningSource as string | undefined),
    endorsements,
    notes: typeof skillAny.notes === "string" ? skillAny.notes : "",
  }
}

const upsertSkill = (list: SkillList, skill: SkillRecord): SkillList => {
  const index = list.findIndex((item) => item.id === skill.id)
  if (index === -1) {
    return [...list, skill]
  }
  const next = [...list]
  next[index] = skill
  return next
}

const toStoreSkill = (skill: SkillRecord) => ({
  id: String(skill.id),
  name: String(skill.name ?? "New Skill"),
  category: String(skill.category ?? SKILL_CATEGORIES[0]),
  proficiency: typeof skill.proficiency === "number" ? skill.proficiency : PROFICIENCY_SCORE_BY_LEVEL.Intermediate,
  yearsOfExperience: typeof skill.yearsOfExperience === "number" ? skill.yearsOfExperience : undefined,
  lastUsed: typeof skill.lastUsed === "string" ? skill.lastUsed : undefined,
})

const createManualSkillId = () => `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const PROFICIENCY_COLORS = {
  Expert: "border-blue-500",
  Advanced: "border-purple-500",
  Intermediate: "border-amber-500",
  Beginner: "border-gray-500",
}

const CATEGORY_COLORS = {
  "Programming Language": "bg-blue-500/20 text-blue-300",
  Framework: "bg-purple-500/20 text-purple-300",
  "Cloud Service": "bg-emerald-500/20 text-emerald-300",
  Tool: "bg-amber-500/20 text-amber-300",
  Database: "bg-pink-500/20 text-pink-300",
  DevOps: "bg-cyan-500/20 text-cyan-300",
  Language: "bg-indigo-500/20 text-indigo-300",
}

function SkillCard({
  skill,
  onEdit,
  onDelete,
  onViewAnalysis,
  candidateDetails,
  searchQuery = "",
}: {
  skill: (typeof initialMockSkills)[0]
  onEdit: (skill: (typeof initialMockSkills)[0]) => void
  onDelete: (id: string) => void
  onViewAnalysis: (skill: (typeof initialMockSkills)[0]) => void
  candidateDetails?: CandidateDetailsResponse | null
  searchQuery?: string
}) {
  const getProficiencyLevel = (proficiency: number): string => {
    if (proficiency >= 4.5) return "Expert"
    if (proficiency >= 3.5) return "Advanced"
    if (proficiency >= 2.5) return "Intermediate"
    return "Beginner"
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "bg-blue-500/20 text-blue-300"
      case "Advanced":
        return "bg-purple-500/20 text-purple-300"
      case "Intermediate":
        return "bg-amber-500/20 text-amber-300"
      default:
        return "bg-gray-500/20 text-gray-300"
    }
  }

  const proficiencyLevel = getProficiencyLevel(skill.proficiency)
  const categoryColor =
    CATEGORY_COLORS[skill.category as keyof typeof CATEGORY_COLORS] || "bg-gray-500/20 text-gray-300"

  // Search highlighting logic
  const query = searchQuery.trim().toLowerCase()
  const name = skill.name || ""
  const nameLower = name.toLowerCase()
  const isMatch = query && nameLower.includes(query)

  const highlightedTitle = isMatch ? (
    <>
      {name.split(new RegExp(`(${query})`, "gi")).map((part, idx) =>
        part.toLowerCase() === query ? (
          <span key={idx} className="bg-yellow-400 text-black px-1 rounded font-semibold">
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  ) : (
    name
  )

  return (
    <Card className={`relative border border-white/10 bg-card p-4 rounded-lg hover:shadow-md hover:shadow-blue-500/10 transition-shadow duration-300 ${
      isMatch ? 'ring-2 ring-yellow-400' : ''
    }`}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(skill)}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(skill.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 pr-24">
        <h3 className="text-lg font-bold text-foreground">
          {highlightedTitle}
        </h3>
        <div className="flex items-center gap-2">
          <Badge className={getProficiencyColor(proficiencyLevel)}>{proficiencyLevel}</Badge>
          <Badge className={categoryColor}>{skill.category}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-4 py-4 border-y border-white/10">
        <div className="space-y-1">
          <p className="text-xs text-foreground/60 uppercase tracking-wide">Years of Experience</p>
          <p className="text-sm font-semibold text-foreground">
            {(() => {
              // Use years from backend if available, otherwise derive from proficiency
              const years = candidateDetails?.skills?.detailed?.find((s: any) => s.name === skill.name)?.years
              if (years) return `${years} year${years > 1 ? 's' : ''}`

              // Fallback to proficiency-based estimate
              if (skill.proficiency >= 4.5) return "5+ years"
              if (skill.proficiency >= 3.5) return "3-5 years"
              if (skill.proficiency >= 2.5) return "1-3 years"
              return "<1 year"
            })()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-foreground/60 uppercase tracking-wide">Last Used</p>
          <p className="text-sm font-semibold text-foreground">Currently using</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-foreground/60 uppercase tracking-wide">Proficiency Score</p>
          <div className="flex items-center gap-2">
            <Progress value={((skill.proficiency ?? 0) / 5) * 100} className="flex-1 h-1.5" />
            <span className="text-sm font-semibold text-foreground">{(skill.proficiency ?? 0).toFixed(1)}/5.0</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-foreground/60 uppercase tracking-wide">Market Demand</p>
          <p className="text-sm font-semibold text-green-400">{(skill as any).marketDemand ?? 0}/100</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-foreground/80">
        {(skill as any).marketDemand > 85
          ? "High demand - maintain and expand proficiency"
          : (skill as any).marketDemand > 70
            ? "Good market demand - solid investment"
            : "Emerging skill - consider for future growth"}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
        <Button variant="outline" size="sm" onClick={() => onViewAnalysis(skill)}>
          View Analysis
        </Button>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { resumes, activeResumeId } = useResumeStore()
  const { addGoal, hasGoalForSkill } = useLearningPathStore()
  const { searchQuery } = useSearchStore()
  const activeResume = resumes.find((r) => r.id === activeResumeId)
  const {
    skills,
    addSkill: addSkillToStore,
    updateSkill: updateSkillInStore,
    removeSkill: removeSkillFromStore,
  } = useSkillsStore() // Get skills from the store
  const router = useRouter() // Initialize useRouter

  const [localSkills, setLocalSkills] = useState<SkillList>(initialMockSkills) // Local skills cache
  const [selectedRole, setSelectedRole] = useState<string>("allRoles")
  const [selectedLevel, setSelectedLevel] = useState<string>("allLevels")
  const [selectedProficiency, setSelectedProficiency] = useState<string>("all")
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)

  // Reset filters when active resume changes
  useEffect(() => {
    setSelectedProficiency("all")
    setSelectedRole("allRoles")
    setSelectedLevel("allLevels")
  }, [activeResumeId])

  // Auto-scroll to first matching skill when search query changes
  useEffect(() => {
    if (searchQuery.trim() && localSkills.length > 0) {
      const query = searchQuery.toLowerCase()
      const firstMatch = localSkills.find(s => 
        s.name?.toLowerCase().includes(query)
      )
      
      if (firstMatch) {
        setTimeout(() => {
          const element = document.getElementById(`skill-card-${firstMatch.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    }
  }, [searchQuery, localSkills])

  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [selectedSkillForAnalysis, setSelectedSkillForAnalysis] = useState<(typeof initialMockSkills)[0] | null>(null)
  const [showLearningGoalsDialog, setShowLearningGoalsDialog] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(true)
  const [selectedSkillsForGoals, setSelectedSkillsForGoals] = useState<string[]>([])
  const [targetProficiency, setTargetProficiency] = useState<string>("Advanced")
  const [timeframe, setTimeframe] = useState<string>("3 months")
  const [timeCommitment, setTimeCommitment] = useState<number>(5)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showGoalSummary, setShowGoalSummary] = useState(false)
  const [newSkill, setNewSkill] = useState<SkillFormState>(createEmptySkillForm())
  const [editingSkillSnapshot, setEditingSkillSnapshot] = useState<SkillRecord | null>(null)
  const [showSkillAnalysisDialog, setShowSkillAnalysisDialog] = useState(false)
  const [selectedSkillForCardAnalysis, setSelectedSkillForCardAnalysis] = useState<
    (typeof initialMockSkills)[0] | null
  >(null)
  const [showDetailedTrendsDialog, setShowDetailedTrendsDialog] = useState(false)
  const [trendFilterType, setTrendFilterType] = useState<string>("all")
  const [trendMinDemand, setTrendMinDemand] = useState<number>(0)
  const [selectedSkillsForComparison, setSelectedSkillsForComparison] = useState<string[]>([])
  const [showComparisonView, setShowComparisonView] = useState(false)
  const [showGapAnalysis, setShowGapAnalysis] = useState(false)
  const [showSetGoalsDialog, setShowSetGoalsDialog] = useState(false)
  const [showSkillCardAnalysis, setShowSkillCardAnalysis] = useState(false) // Added this line

  const { toast } = useToast()

  // Backend data state
  const [backendSkills, setBackendSkills] = useState<typeof initialMockSkills>([])
  const [candidateDetails, setCandidateDetails] = useState<CandidateDetailsResponse | null>(null)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [skillsError, setSkillsError] = useState<string | null>(null)

  // Prevent double API calls in React Strict Mode
  const skillsFetched = useRef(false)

  // Fetch skills from backend
  useEffect(() => {
    if (skillsFetched.current) return
    skillsFetched.current = true

    const fetchSkills = async () => {
      if (!activeResume?.candidateId) {
        console.log('📌 No candidateId found, using fallback mock data')
        setBackendSkills(initialMockSkills)
        setIsLoadingSkills(false)
        return
      }

      try {
        setIsLoadingSkills(true)
        setSkillsError(null)
        const startTime = Date.now()

        console.log('🔍 Fetching candidate details for ID:', activeResume.candidateId)
        const candidateData = await getCandidateDetails(activeResume.candidateId)

        console.log('✅ Candidate data received:', JSON.stringify(candidateData, null, 2))

        // DEFENSIVE CHECK: Verify response structure
        if (!candidateData) {
          throw new Error('No candidate data returned from backend')
        }

        if (!candidateData.skills) {
          console.error('❌ candidateData.skills is undefined. Full response:', candidateData)
          throw new Error('Backend response missing skills property')
        }

        if (!candidateData.skills.detailed) {
          console.error('❌ candidateData.skills.detailed is undefined. Skills object:', candidateData.skills)
          throw new Error('Backend response missing skills.detailed array')
        }

        if (!Array.isArray(candidateData.skills.detailed)) {
          console.error('❌ skills.detailed is not an array:', typeof candidateData.skills.detailed)
          throw new Error('Backend skills.detailed is not an array')
        }

        console.log(`📊 Found ${candidateData.skills.detailed.length} skills from backend`)

        setCandidateDetails(candidateData)

        // Transform backend skills to component Skill interface
        const transformedSkills: typeof initialMockSkills = candidateData.skills.detailed.map((skill, index) => {
          // Map proficiency string to number (1-5 scale)
          const proficiencyMap: Record<string, number> = {
            "Expert": 5,
            "Advanced": 4,
            "Intermediate": 3,
            "Beginner": 2,
          }
          const proficiencyNumber = proficiencyMap[skill.proficiency] ?? 3

          // Generate random market demand between 70-100
          const marketDemand = Math.floor(Math.random() * 31) + 70

          // Generate random trend
          const trends: Array<"up" | "stable" | "down"> = ["up", "stable", "down"]
          const trend = trends[Math.floor(Math.random() * trends.length)]

          return {
            id: skill.id.toString(),
            name: skill.name,
            category: skill.category || 'Uncategorized',
            proficiency: proficiencyNumber,
            confidence: 0.85,
            extractionMethod: "Backend NER",
            marketDemand: marketDemand,
            trend: trend,
            recommendation: "Backend Extracted",
            jobRoles: getJobRolesForCategory(skill.category || 'Uncategorized'),
            jobLevels: getJobLevelsForProficiency(skill.proficiency),
          }
        })

        console.log(`✅ Transformed ${transformedSkills.length} skills successfully`)

        // Ensure minimum 2.5 second display duration for loading state
        const elapsed = Date.now() - startTime
        const minDelay = 2500  // 2.5 seconds for dashboard loading
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
        }

        // Check for empty skills array - use fallback if empty
        if (transformedSkills.length === 0) {
          console.warn('⚠️ No skills were extracted from resume, using fallback')
          setBackendSkills(initialMockSkills)
          setIsLoadingSkills(false)
          return
        }

        setBackendSkills(transformedSkills)
        setIsLoadingSkills(false)
      } catch (error) {
        console.error('❌ Failed to fetch skills:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          candidateId: activeResume?.candidateId
        })

        setSkillsError(
          error instanceof Error 
            ? `Failed to load skills: ${error.message}` 
            : 'Failed to load skills from backend'
        )

        // Fallback to mock data on error
        console.warn('⚠️ Using fallback mock skills due to error')
        setBackendSkills(initialMockSkills)
        setIsLoadingSkills(false)
      }
    }

    fetchSkills()
  }, [activeResume?.candidateId])

  // Helper: Map proficiency string to number (1-5 scale)
  function mapProficiencyToNumber(proficiency: string): number {
    const mapping: Record<string, number> = {
      "Beginner": 2.0,
      "Intermediate": 3.5,
      "Advanced": 4.5,
      "Expert": 5.0,
    }
    return mapping[proficiency] ?? 3.0
  }

  // Helper: Get market demand (static mapping for now)
  function getMarketDemandForSkill(skillName: string): number {
    const demandMap: Record<string, number> = {
      "React": 92, "TypeScript": 87, "Node.js": 82, "Python": 88,
      "AWS": 78, "Docker": 75, "Kubernetes": 70, "PostgreSQL": 72,
      "MongoDB": 68, "GraphQL": 65, "Next.js": 80, "Vue": 60,
      "Angular": 65, "Java": 75, "Spring Boot": 70, "C++": 55,
      "Go": 68, "Rust": 62, "TensorFlow": 72, "PyTorch": 70,
    }
    return demandMap[skillName] ?? 50 // Default to medium demand
  }

  // Helper: Get trend (static for now)
  function getTrendForSkill(skillName: string): "up" | "stable" | "down" {
    const trendMap: Record<string, "up" | "stable" | "down"> = {
      "React": "up", "TypeScript": "up", "Python": "up", "AWS": "up",
      "Kubernetes": "up", "Docker": "stable", "PostgreSQL": "stable",
      "Angular": "down", "Vue": "down", "jQuery": "down",
    }
    return trendMap[skillName] ?? "stable"
  }

  // Helper: Generate recommendation based on proficiency
  function generateRecommendation(proficiency: string, skillName: string): string {
    if (proficiency === "Expert") {
      return `Strong mastery of ${skillName}. Consider mentoring others or contributing to open source.`
    } else if (proficiency === "Advanced") {
      return `Solid ${skillName} skills. Focus on advanced patterns and best practices.`
    } else if (proficiency === "Intermediate") {
      return `Build practical ${skillName} projects to reach advanced level.`
    } else {
      return `Start with ${skillName} fundamentals and build small projects.`
    }
  }

  // Helper: Get job roles by category
  function getJobRolesForCategory(category: string): string[] {
    const roleMap: Record<string, string[]> = {
      "Frontend": ["Frontend Developer", "React Developer", "UI Engineer"],
      "Backend": ["Backend Developer", "API Developer", "System Architect"],
      "Language": ["Software Engineer", "Full Stack Developer"],
      "DevOps": ["DevOps Engineer", "Cloud Engineer", "SRE"],
      "Database": ["Database Administrator", "Data Engineer"],
      "Cloud": ["Cloud Architect", "Cloud Engineer"],
      "ML/AI": ["ML Engineer", "Data Scientist", "AI Researcher"],
    }
    return roleMap[category] ?? ["Software Engineer"]
  }

  // Helper: Get job levels by proficiency
  function getJobLevelsForProficiency(proficiency: string): string[] {
    if (proficiency === "Expert") return ["Senior", "Lead", "Staff"]
    if (proficiency === "Advanced") return ["Mid-Level", "Senior"]
    if (proficiency === "Intermediate") return ["Junior", "Mid-Level"]
    return ["Intern", "Junior"]
  }

  // Use backendSkills instead of localSkills when available, fallback to skills store or localSkills
  const currentSkills = backendSkills.length > 0 ? backendSkills : (skills.length > 0 ? skills : localSkills)

  // Calculate top 50 skills by weighted quality score
  const top50Skills = useMemo(() => {
    return [...currentSkills]
      .sort((a, b) => {
        const aMarketDemand = (a as any).marketDemand ?? 50
        const bMarketDemand = (b as any).marketDemand ?? 50
        const scoreA = (a.proficiency ?? 0) * 0.6 + (aMarketDemand / 20) * 0.4
        const scoreB = (b.proficiency ?? 0) * 0.6 + (bMarketDemand / 20) * 0.4
        return scoreB - scoreA
      })
      .slice(0, 50)
  }, [currentSkills])

  // Use top 15 skills by market demand for radar chart
  const radarData = useMemo(() => {
    return currentSkills
      .sort((a, b) => {
        const aAny = a as any
        const bAny = b as any
        return (bAny.marketDemand ?? 0) - (aAny.marketDemand ?? 0)
      })
      .slice(0, 15)
      .map((skill) => {
        const skillAny = skill as any
        return {
          name: skill.name,
          proficiency: skill.proficiency ?? 0,
          marketDemand: (skillAny.marketDemand ?? 0) / 20, // Normalize to 0-5 scale
        }
      })
  }, [currentSkills])

  // Generate synthetic trend data based on current market demand
  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Get top 15 skills by market demand
    const topSkills = currentSkills
      .sort((a, b) => {
        const aAny = a as any
        const bAny = b as any
        return (bAny.marketDemand ?? 0) - (aAny.marketDemand ?? 0)
      })
      .slice(0, 15)

    // Generate trend based on current demand and trend direction
    return months.map((month, index) => {
      const dataPoint: Record<string, number | string> = { month }

      topSkills.forEach(skill => {
        const skillAny = skill as any
        const baseDemand = skillAny.marketDemand ?? 50
        const trendMultiplier = skillAny.trend === "up" ? 1.02
                              : skillAny.trend === "down" ? 0.98
                              : 1.0

        // Simulate growth/decline over months
        const monthValue = baseDemand * Math.pow(trendMultiplier, index)
        dataPoint[skill.name] = Math.round(monthValue)
      })

      return dataPoint
    })
  }, [currentSkills])

  // Calculate proficiency distribution from real skills
  const proficiencyDistribution = useMemo(() => {
    const beginner = currentSkills.filter(s => (s.proficiency ?? 0) < 2.5).length
    const intermediate = currentSkills.filter(s => (s.proficiency ?? 0) >= 2.5 && (s.proficiency ?? 0) < 3.5).length
    const advanced = currentSkills.filter(s => (s.proficiency ?? 0) >= 3.5 && (s.proficiency ?? 0) < 4.5).length
    const expert = currentSkills.filter(s => (s.proficiency ?? 0) >= 4.5).length

    return [
      { name: "Beginner", count: beginner },
      { name: "Intermediate", count: intermediate },
      { name: "Advanced", count: advanced },
      { name: "Expert", count: expert }
    ]
  }, [currentSkills])

  const filteredSkills = useMemo(() => {
    return top50Skills.filter(skill => {
      // Filter by Job Role
      if (selectedRole && selectedRole !== "allRoles") {
        const skillName = (skill.name || "").toLowerCase()
        const skillCategory = (skill.category || "").toLowerCase()
        const role = selectedRole.toLowerCase()

        // Map job roles to relevant skills
        const roleSkillMap: Record<string, string[]> = {
          "frontend developer": ["react", "vue", "angular", "typescript", "javascript", "html", "css", "sass", "tailwind", "bootstrap", "webpack", "vite", "npm", "yarn"],
          "backend engineer": ["node", "express", "python", "django", "flask", "fastapi", "java", "spring", "c#", ".net", "go", "rust", "api", "rest", "graphql"],
          "full stack": ["react", "vue", "angular", "node", "express", "python", "java", "typescript", "javascript", "api", "database", "sql", "mongodb"],
          "mobile developer - ios": ["swift", "objective-c", "ios", "xcode", "cocoapods", "uikit", "swiftui"],
          "mobile developer - android": ["kotlin", "java", "android", "gradle", "jetpack", "kotlin"],
          "react developer": ["react", "jsx", "redux", "nextjs", "hooks", "typescript", "javascript"],
          "angular developer": ["angular", "typescript", "rxjs", "ngrx", "jasmine", "karma"],
          "vue developer": ["vue", "vuex", "nuxt", "javascript", "typescript"],
          "node.js developer": ["node", "express", "javascript", "typescript", "npm", "yarn", "api"],
          "python developer": ["python", "django", "flask", "fastapi", "pytest", "numpy", "pandas"],
          "java developer": ["java", "spring", "maven", "gradle", "junit", "tomcat"],
          ".net developer": ["c#", ".net", "asp.net", "visual studio"],
          "devops engineer": ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "jenkins", "gitlab", "terraform", "ansible"],
          "cloud engineer": ["aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "cloudformation"],
          "data scientist": ["python", "r", "machine learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn"],
          "data engineer": ["python", "sql", "apache spark", "hadoop", "etl", "airflow", "kafka", "postgresql"],
          "data analyst": ["sql", "python", "r", "tableau", "power bi", "excel", "analytics"],
          "machine learning engineer": ["python", "tensorflow", "pytorch", "keras", "scikit-learn", "ml", "ai"],
          "ai engineer": ["python", "machine learning", "deep learning", "nlp", "transformers", "openai"],
          "security engineer": ["security", "cybersecurity", "encryption", "ssl", "firewall", "penetration"],
          "penetration tester": ["security", "penetration testing", "network", "vulnerability"],
          "qa engineer": ["testing", "selenium", "junit", "testng", "cypress", "jest"],
          "automation test engineer": ["selenium", "cypress", "testng", "junit", "automation"],
          "ui/ux designer": ["figma", "sketch", "adobe xd", "prototyping", "ui", "ux"],
          "product designer": ["figma", "design", "prototype", "user research"],
          "product manager": ["agile", "scrum", "product", "management"],
          "technical product manager": ["technical", "product", "api", "backend"],
          "technical writer": ["documentation", "markdown", "technical writing"],
          "database administrator": ["sql", "database", "mysql", "postgresql", "mongodb", "oracle"],
          "system administrator": ["linux", "windows", "system", "administration"],
          "network engineer": ["networking", "tcp/ip", "dns", "firewall", "cisco"],
          "site reliability engineer": ["devops", "kubernetes", "monitoring", "logging", "infrastructure"],
          "solutions architect": ["architecture", "design", "cloud", "enterprise"],
          "cloud architect": ["cloud", "aws", "azure", "gcp", "architecture"],
          "enterprise architect": ["enterprise", "architecture", "design", "patterns"],
        }

        const roleKeywords = roleSkillMap[role] || []
        const matches = roleKeywords.some(keyword => 
          skillName.includes(keyword) || skillCategory.includes(keyword)
        )

        if (!matches) {
          return false
        }
      }

      // Filter by Job Level (using proficiency as a proxy)
      if (selectedLevel && selectedLevel !== "allLevels") {
        const proficiency = skill.proficiency ?? 0
        const levelProficiencyMap: Record<string, [number, number]> = {
          "intern": [0, 1.5],
          "entry-level": [1, 2],
          "junior": [1.5, 2.5],
          "mid-level": [2.5, 3.5],
          "senior": [3.5, 4.2],
          "lead": [4, 4.5],
          "staff": [4.2, 4.8],
          "principal": [4.5, 5],
          "distinguished": [4.8, 5],
          "architect": [4.5, 5],
          "manager": [3, 5],
          "senior manager": [3.5, 5],
          "director": [4, 5],
          "senior director": [4.2, 5],
          "vp": [4.5, 5],
          "cto": [4.5, 5],
        }

        const [minProf, maxProf] = levelProficiencyMap[selectedLevel.toLowerCase()] || [0, 5]
        if (proficiency < minProf || proficiency > maxProf) {
          return false
        }
      }

      // Filter by Proficiency
      if (selectedProficiency !== "all") {
        const proficiency = skill.proficiency ?? 0

        switch (selectedProficiency) {
          case "expert":
            return proficiency >= 4.5
          case "advanced":
            return proficiency >= 3.5 && proficiency < 4.5
          case "intermediate":
            return proficiency >= 2.5 && proficiency < 3.5
          case "beginner":
            return proficiency < 2.5
          case "jobReady":
            return proficiency >= 3.5
          case "master":
            return proficiency >= 4.5
          case "needsImprovement":
            return proficiency < 2.5
          default:
            return true
        }
      }

      return true
    })
  }, [top50Skills, selectedRole, selectedLevel, selectedProficiency])

  // Debug logging for filters
  useEffect(() => {
    console.log('🔍 Filter Debug:', {
      selectedRole,
      selectedLevel,
      selectedProficiency,
      totalSkills: top50Skills.length,
      filteredSkills: filteredSkills.length,
      displayedSkills: (showAll ? filteredSkills.slice(0, 50) : filteredSkills.slice(0, 6)).length,
    })
  }, [selectedRole, selectedLevel, selectedProficiency, top50Skills.length, filteredSkills.length, showAll])

  // Loading state
  if (isLoadingSkills) {
    return (
      <>
        <div className="flex-1 w-full bg-gray-50 dark:bg-gray-950">
          <main className="container mx-auto p-6 max-w-screen-2xl">
            {/* Empty content - loading dialog will overlay */}
          </main>
        </div>
        <LoadingDialog
          isOpen={showLoadingDialog}
          title="Loading Your Dashboard"
          message="Preparing your skill portfolio..."
          onComplete={() => {
            setShowLoadingDialog(false)
            setIsLoadingSkills(false)
          }}
        />
      </>
    )
  }

  // Error state with better messaging
  if (skillsError && backendSkills.length === 0) {
    return (
      <div className="flex-1 w-full bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto p-6 max-w-screen-2xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-6xl">⚠️</div>
              <h2 className="text-2xl font-bold text-foreground">Unable to Load Skills</h2>
              <p className="text-destructive">{skillsError}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Possible causes:</p>
                <ul className="list-disc list-inside text-left">
                  <li>Backend server is not running</li>
                  <li>Resume hasn't been analyzed yet</li>
                  <li>Invalid candidate ID</li>
                  <li>Network connectivity issue</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
                <Button variant="outline" onClick={() => router.push('/resume')}>
                  Upload New Resume
                </Button>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Debug Info:
                </p>
                <code className="text-xs bg-black/20 p-2 rounded block text-left">
                  Candidate ID: {activeResume?.candidateId || 'Not set'}
                  <br />
                  Resume ID: {activeResume?.id || 'Not set'}
                  <br />
                  Backend URL: {process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}
                </code>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!activeResume || currentSkills.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
          <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-foreground/60" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">No Active Analysis</h2>
            <p className="text-foreground/70 max-w-sm">
              Upload and analyze a resume to see your comprehensive skills dashboard with analytics and insights.
            </p>
          </div>
          <Button
            onClick={() => router.push("/resume")} // Use router.push
            className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 h-auto whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Upload Resume
          </Button>
        </div>
      </div>
    )
  }

  const formatProficiency = (proficiency: number | undefined): string => {
    return (proficiency ?? 0).toFixed(1)
  }

  const calculateGapSize = (marketDemand: number | undefined, proficiency: number | undefined): number => {
    return (marketDemand ?? 0) / 20 - (proficiency ?? 0)
  }

  const displayedSkills = showAll ? filteredSkills.slice(0, 50) : filteredSkills.slice(0, 6)
  const remaining = Math.max(0, filteredSkills.length - 6)

  const handleEditSkill = (skill: SkillRecord) => {
    const formData = buildFormFromSkill(skill)
    setEditingSkillId(skill.id)
    setEditingSkillSnapshot(skill)
    setNewSkill(formData)
    setIsEditMode(true)
    setIsAddSkillOpen(true)
  }

  const handleAddSkillClick = () => {
    // Reset all state for a clean "Add" experience
    setNewSkill(createEmptySkillForm())
    setIsEditMode(false)
    setEditingSkillId(null)
    setEditingSkillSnapshot(null)
    setIsAddSkillOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setIsAddSkillOpen(open)
    if (!open) {
      // Clean up state when dialog closes
      setNewSkill(createEmptySkillForm())
      setIsEditMode(false)
      setEditingSkillId(null)
      setEditingSkillSnapshot(null)
    }
  }

  const handleDeleteSkill = (id: string) => {
    setSkillToDelete(id)
    setDeleteConfirmOpen(true)
  }

  // Update confirmDelete with enhanced toast and skills store integration
  const confirmDelete = () => {
    if (skillToDelete) {
      try {
        // Find the skill to get its name for better messaging
        const skillToRemove = currentSkills.find(skill => skill.id === skillToDelete)
        const skillName = skillToRemove?.name || 'Unknown Skill'
        
        // Update both backend and local skills
        setBackendSkills(backendSkills.filter((skill) => skill.id !== skillToDelete))
        setLocalSkills(localSkills.filter((skill) => skill.id !== skillToDelete))
        
        // Also update the skills store if the skill exists there
        removeSkillFromStore(skillToDelete)
        
        setDeleteConfirmOpen(false)
        setSkillToDelete(null)
        
        toast({
          title: "Skill Deleted",
          description: `The skill "${skillName}" has been removed from your profile.`,
          variant: "destructive",
        })
      } catch (error) {
        console.error("[v0] Error deleting skill:", error)
        toast({
          title: "Error",
          description: "Failed to delete skill. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveSkill = () => {
    const baseSkill = editingSkillSnapshot ?? undefined
    const builtSkill = buildSkillFromForm(newSkill, baseSkill)

    if (isEditMode && editingSkillId) {
      setBackendSkills((prev) => upsertSkill(prev, builtSkill))
      setLocalSkills((prev) => upsertSkill(prev, builtSkill))
      updateSkillInStore(builtSkill.id, toStoreSkill(builtSkill))
      toast({
        title: "Skill updated",
        description: "The skill details have been updated successfully.",
      })
    } else {
      const skillWithId = builtSkill.id ? builtSkill : { ...builtSkill, id: createManualSkillId() }
      setBackendSkills((prev) => upsertSkill(prev, skillWithId))
      setLocalSkills((prev) => upsertSkill(prev, skillWithId))
      addSkillToStore(toStoreSkill(skillWithId))
      toast({
        title: "Skill added",
        description: "A new skill has been added to your profile.",
      })
    }

    // Close dialog and clean up state
    setIsAddSkillOpen(false)
    setNewSkill(createEmptySkillForm())
    setIsEditMode(false)
    setEditingSkillId(null)
    setEditingSkillSnapshot(null)
  }

  const handleViewAnalysis = (skill: (typeof initialMockSkills)[0]) => {
    setSelectedSkillForAnalysis(skill)
    setShowAnalysisDialog(true)
  }



  // Helper to get months from timeframe string
  const getMonthsFromString = (timeframe: string): number => {
    if (timeframe.includes("month")) {
      return Number.parseInt(timeframe.split(" ")[0])
    } else if (timeframe.includes("year")) {
      return Number.parseInt(timeframe.split(" ")[0]) * 12
    }
    return 3 // Default to 3 months
  }

  // Helper to get proficiency level (redefined for handleSubmitLearningGoals context)
  const getProficiencyLevel = (proficiency: number): string => {
    const prof = proficiency ?? 0
    if (prof >= 4.5) return "Expert"
    if (prof >= 3.5) return "Advanced"
    if (prof >= 2.5) return "Intermediate"
    return "Beginner"
  }

  const handleSubmitLearningGoals = () => {
    if (selectedSkillsForGoals.length === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one skill to create learning goals",
        variant: "destructive",
      })
      return
    }

    if (!targetProficiency || !timeframe || timeCommitment === 0) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Logic to create goals based on selected skills and parameters
    selectedSkillsForGoals.forEach((skillId) => {
      const skill = currentSkills.find((s) => s.id === skillId) // Use currentSkills
      if (skill) {
        // Mock goal creation - replace with actual store action if needed
        const newGoal = {
          id: `goal-${Date.now()}-${skillId}`,
          skillName: skill.name,
          skillId: skill.id,
          resumeId: activeResumeId || "",
          category: skill.category,
          currentProficiency: getProficiencyLevel(skill.proficiency), // Assume getProficiencyLevel is accessible or redefined
          targetProficiency: targetProficiency,
          targetDate: new Date(Date.now() + getMonthsFromString(timeframe) * 30 * 24 * 60 * 60 * 1000), // Approximate target date
          status: "not-started" as const,
          progress: 0,
          priority: "medium" as const,
          resources: [],
          notes: "",
          createdAt: new Date(),
          source: "dashboard" as const,
          milestones: [],
        }
        addGoal(newGoal)
      }
    })

    toast({
      title: "Goals Added",
      description: `${selectedSkillsForGoals.length} skill(s) added to your learning goals`,
    })
    setShowLearningGoalsDialog(false)
    setSelectedSkillsForGoals([])
    setTargetProficiency("Advanced")
    setTimeframe("3 months")
    setTimeCommitment(5)
    setSelectedTemplate(null)
  }

  const handleCreateImprovementPlan = () => {
    toast({
      title: "Improvement plan created",
      description: "Your personalized improvement plan has been generated",
    })
    setShowAnalysisDialog(false)
  }

  const handleViewSkillAnalysis = (skill: (typeof initialMockSkills)[0]) => {
    setSelectedSkillForCardAnalysis(skill)
    setShowSkillAnalysisDialog(true)
    setShowSkillCardAnalysis(true) // Set this to true when opening the dialog
  }

  const handleViewDetailedTrends = () => {
    console.log("Opening detailed trends dialog", currentSkills.length)
    setShowDetailedTrendsDialog(true)
  }

  const getFilteredTrendsSkills = () => {
    return filteredSkills.filter((skill) => {
      const skillAny = skill as any
      const trendMatch =
        trendFilterType === "all" ||
        (trendFilterType === "up" && skillAny.trend === "up") ||
        (trendFilterType === "stable" && skillAny.trend === "stable") ||
        (trendFilterType === "down" && skillAny.trend === "down")
      const demandMatch = (skillAny.marketDemand ?? 0) >= trendMinDemand
      return trendMatch && demandMatch
    })
  }

  const calculateGrowthPotential = (skill: (typeof initialMockSkills)[0]): number => {
    const skillAny = skill as any
    const demandScore = (skillAny.marketDemand ?? 0) / 100
    const trendMultiplier = skillAny.trend === "up" ? 1.5 : skillAny.trend === "stable" ? 1.0 : 0.5
    const proficiencyGap = (5 - (skill.proficiency ?? 0)) / 5
    return Math.round(demandScore * trendMultiplier * proficiencyGap * 100)
  }

  const getCareerPathRecommendations = (): Array<{ skill: string; reason: string; impact: string }> => {
    return filteredSkills
      .filter((s) => {
        const sAny = s as any
        return sAny.trend === "up" && (sAny.marketDemand ?? 0) > 75
      })
      .sort((a, b) => {
        const aAny = a as any
        const bAny = b as any
        return (bAny.marketDemand ?? 0) - (aAny.marketDemand ?? 0)
      })
      .slice(0, 3)
      .map((skill) => {
        const skillAny = skill as any
        return {
          skill: skill.name,
          reason:
            (skillAny.marketDemand ?? 0) > 85
              ? "High demand with strong growth"
              : "Emerging opportunity with growth potential",
          impact: `+${Math.round((skillAny.marketDemand ?? 0) * 0.5)}% salary potential`,
        }
      })
  }

  // Helper to calculate average proficiency from selected skills
  const calculateAverageProficiency = (skillIds: string[]): number => {
    const selectedSkills = currentSkills.filter((s) => skillIds.includes(s.id))
    if (selectedSkills.length === 0) return 0
    const totalProficiency = selectedSkills.reduce((sum, skill) => sum + (skill.proficiency ?? 0), 0)
    return totalProficiency / selectedSkills.length
  }

  const categoryDistribution = [
    { name: "Programming Languages", value: 35 },
    { name: "Frameworks", value: 25 },
    { name: "Cloud Services", value: 20 },
    { name: "Tools", value: 20 },
  ]

  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"]

  const calculateGoalDifficulty = (): string => {
    if (selectedSkillsForGoals.length === 0) return "Easy"

    const avgCurrentProficiency =
      selectedSkillsForGoals.reduce((sum, skillId) => {
        const skill = currentSkills.find((s) => s.id === skillId) // Use currentSkills
        return sum + (skill?.proficiency ?? 0)
      }, 0) / selectedSkillsForGoals.length

    const targetLevel =
      targetProficiency === "Expert"
        ? 4.8
        : targetProficiency === "Advanced"
          ? 4.0
          : targetProficiency === "Intermediate"
            ? 3.0
            : 0
    const proficiencyGap = Math.max(0, targetLevel - avgCurrentProficiency)
    const timeframeMonths = getMonthsFromString(timeframe)
    const timeCommitmentPerMonth = timeCommitment * 4 // Approximate hours per month
    const totalHoursAvailable = timeframeMonths * timeCommitmentPerMonth

    // Heuristic calculation for difficulty
    let difficultyScore = 0
    if (proficiencyGap > 0) {
      difficultyScore = (proficiencyGap * 100) / (totalHoursAvailable * 2) // Normalized score
    }

    if (difficultyScore > 8) return "Very Challenging"
    if (difficultyScore > 5) return "Challenging"
    if (difficultyScore > 2) return "Moderate"
    return "Easy"
  }

  const calculateEstimatedCompletion = (): string => {
    const months = getMonthsFromString(timeframe)
    const today = new Date()
    const completionDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate())
    return completionDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  const getResourcesForSkills = (): Array<{ skill: string; resources: string[] }> => {
    return selectedSkillsForGoals.map((skillId) => {
      const skill = currentSkills.find((s) => s.id === skillId) // Use currentSkills
      if (!skill) return { skill: "", resources: [] }

      const resources = [
        `Udemy: ${skill.name} Masterclass`,
        `Coursera: Advanced ${skill.name}`,
        `Official ${skill.name} Documentation`,
        `GitHub: ${skill.name} Projects`,
        `YouTube: ${skill.name} Tutorials`,
      ]
      return { skill: skill.name, resources }
    })
  }

  const goalTemplates = [
    {
      id: "quick-boost",
      name: "Quick Boost",
      description: "Rapid skill improvement in 1 month",
      timeframe: "1 month",
      commitment: 10,
      target: "Advanced",
    },
    {
      id: "steady-growth",
      name: "Steady Growth",
      description: "Balanced learning over 3 months",
      timeframe: "3 months",
      commitment: 5,
      target: "Advanced",
    },
    {
      id: "mastery",
      name: "Mastery Path",
      description: "Deep expertise over 6 months",
      timeframe: "6 months",
      commitment: 8,
      target: "Expert",
    },
    {
      id: "long-term",
      name: "Long-term Excellence",
      description: "Comprehensive learning over 1 year",
      timeframe: "1 year",
      commitment: 4,
      target: "Expert",
    },
  ]

  const applyTemplate = (templateId: string) => {
    const template = goalTemplates.find((t) => t.id === templateId)
    if (template) {
      setTimeframe(template.timeframe)
      setTimeCommitment(template.commitment)
      setTargetProficiency(template.target)
      setSelectedTemplate(templateId)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">My Skills Dashboard</h1>
            <p className="text-muted-foreground text-lg">Your extracted skills with actionable market insights</p>
          </div>
          <Dialog open={isAddSkillOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90 gap-2"
                onClick={handleAddSkillClick}
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[60]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Skill" : "Add New Skill"}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update the skill details below."
                    : "Manually add a new skill to your profile with detailed metrics."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1 p-6">
                {/* Section 1: Basic Information */}
                <h3 className="text-base font-semibold mb-4 mt-0 text-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-6 mb-4">
                  <div>
                    <Label htmlFor="skill-name" className="text-sm font-medium mb-2 block">
                      Skill Name
                    </Label>
                    <Input
                      id="skill-name"
                      placeholder="e.g., React, Python, AWS"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="skill-category" className="text-sm font-medium mb-2 block">
                      Skill Category
                    </Label>
                    <Select
                      value={newSkill.category}
                      onValueChange={(value) =>
                        setNewSkill((prev) => ({ ...prev, category: ensureCategory(value) }))
                      }
                    >
                      <SelectTrigger id="skill-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section 2: Proficiency Details */}
                <h3 className="text-base font-semibold mb-4 mt-6 text-foreground">Proficiency Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-6 mb-4">
                  <div>
                    <Label htmlFor="proficiency-level" className="text-sm font-medium mb-2 block">
                      Proficiency Level
                    </Label>
                    <Select
                      value={newSkill.proficiencyLevel}
                      onValueChange={(value) =>
                        setNewSkill((prev) => {
                          const level = ensureProficiencyLevel(value)
                          return {
                            ...prev,
                            proficiencyLevel: level,
                            proficiencyScore: mapLevelToScore(level),
                          }
                        })
                      }
                    >
                      <SelectTrigger id="proficiency-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFICIENCY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="years-experience" className="text-sm font-medium mb-2 block">
                      Years of Experience
                    </Label>
                    <Input
                      id="years-experience"
                      type="number"
                      min="0"
                      max="20"
                      value={newSkill.yearsOfExperience}
                      onChange={(e) =>
                        setNewSkill((prev) => ({
                          ...prev,
                          yearsOfExperience: clampNumber(safeParseInt(e.target.value, 0), 0, 50),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Proficiency Score (1-5)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[newSkill.proficiencyScore]}
                      onValueChange={(value) =>
                        setNewSkill((prev) => {
                          const score = clampNumber(value[0] ?? prev.proficiencyScore, 1, 5)
                          return {
                            ...prev,
                            proficiencyScore: score,
                            proficiencyLevel: mapScoreToLevel(score),
                          }
                        })
                      }
                      min={1}
                      max={5}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold text-foreground w-12">{newSkill.proficiencyScore}</span>
                  </div>
                </div>

                {/* Section 3: Context & Usage */}
                <h3 className="text-base font-semibold mb-4 mt-6 text-foreground">Context & Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-6 mb-4">
                  <div>
                    <Label htmlFor="last-used" className="text-sm font-medium mb-2 block">
                      Last Used
                    </Label>
                    <Select
                      value={newSkill.lastUsed}
                      onValueChange={(value) =>
                        setNewSkill((prev) => ({ ...prev, lastUsed: ensureLastUsed(value) }))
                      }
                    >
                      <SelectTrigger id="last-used">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {LAST_USED_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="project-count" className="text-sm font-medium mb-2 block">
                      Project Count
                    </Label>
                    <Input
                      id="project-count"
                      type="number"
                      min="0"
                      value={newSkill.projectCount}
                      onChange={(e) =>
                        setNewSkill((prev) => ({
                          ...prev,
                          projectCount: clampNumber(safeParseInt(e.target.value, 0), 0, 1000),
                        }))
                      }
                      placeholder="Number of projects"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="learning-source" className="text-sm font-medium mb-2 block">
                    Learning Source
                  </Label>
                  <Select
                    value={newSkill.learningSource}
                    onValueChange={(value) =>
                      setNewSkill((prev) => ({ ...prev, learningSource: ensureLearningSource(value) }))
                    }
                  >
                    <SelectTrigger id="learning-source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNING_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Section 4: Additional Info */}
                <h3 className="text-base font-semibold mb-4 mt-6 text-foreground">Additional Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="certification"
                      checked={newSkill.certificationAvailable}
                      onCheckedChange={(checked) =>
                        setNewSkill({ ...newSkill, certificationAvailable: checked as boolean })
                      }
                    />
                    <Label htmlFor="certification" className="text-sm font-medium cursor-pointer">
                      Certification Available
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="endorsements" className="text-sm font-medium mb-2 block">
                      Endorsements
                    </Label>
                    <Input
                      id="endorsements"
                      type="number"
                      min="0"
                      value={newSkill.endorsements}
                      onChange={(e) =>
                        setNewSkill((prev) => ({
                          ...prev,
                          endorsements: clampNumber(safeParseInt(e.target.value, 0), 0, 100000),
                        }))
                      }
                      placeholder="Number of endorsements"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="skill-demand" className="text-sm font-medium mb-2 block">
                    Market Demand (0-100)
                  </Label>
                  <Input
                    id="skill-demand"
                    type="number"
                    min="0"
                    max="100"
                    value={newSkill.marketDemand}
                    onChange={(e) =>
                      setNewSkill((prev) => ({
                        ...prev,
                        marketDemand: clampNumber(safeParseInt(e.target.value, 50), 0, 100),
                      }))
                    }
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any personal notes about this skill..."
                    value={newSkill.notes}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, notes: e.target.value }))}
                    className="min-h-24"
                  />
                </div>
                <Button onClick={handleSaveSkill} className="w-full bg-primary mt-6">
                  {isEditMode ? "Update Skill" : "Add Skill"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ActiveResumeIndicator />

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="role-filter" className="text-sm font-medium mb-2 block">
              Filter by Job Role
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allRoles">All Roles</SelectItem>
                <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
                <SelectItem value="Full Stack">Full Stack Developer</SelectItem>
                <SelectItem value="Mobile Developer - iOS">Mobile Developer - iOS</SelectItem>
                <SelectItem value="Mobile Developer - Android">Mobile Developer - Android</SelectItem>
                <SelectItem value="React Developer">React Developer</SelectItem>
                <SelectItem value="Angular Developer">Angular Developer</SelectItem>
                <SelectItem value="Vue Developer">Vue Developer</SelectItem>
                <SelectItem value="Node.js Developer">Node.js Developer</SelectItem>
                <SelectItem value="Python Developer">Python Developer</SelectItem>
                <SelectItem value="Java Developer">Java Developer</SelectItem>
                <SelectItem value=".NET Developer">.NET Developer</SelectItem>
                <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                <SelectItem value="Cloud Engineer">Cloud Engineer (AWS/Azure/GCP)</SelectItem>
                <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                <SelectItem value="Data Engineer">Data Engineer</SelectItem>
                <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                <SelectItem value="Machine Learning Engineer">Machine Learning Engineer</SelectItem>
                <SelectItem value="AI/ML Engineer">AI Engineer</SelectItem>
                <SelectItem value="Security Engineer">Security Engineer</SelectItem>
                <SelectItem value="Penetration Tester">Penetration Tester</SelectItem>
                <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                <SelectItem value="Automation Test Engineer">Automation Test Engineer</SelectItem>
                <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                <SelectItem value="Product Designer">Product Designer</SelectItem>
                <SelectItem value="Product Manager">Product Manager</SelectItem>
                <SelectItem value="Technical Product Manager">Technical Product Manager</SelectItem>
                <SelectItem value="Technical Writer">Technical Writer</SelectItem>
                <SelectItem value="Database Administrator">Database Administrator</SelectItem>
                <SelectItem value="System Administrator">System Administrator</SelectItem>
                <SelectItem value="Network Engineer">Network Engineer</SelectItem>
                <SelectItem value="Site Reliability Engineer">Site Reliability Engineer (SRE)</SelectItem>
                <SelectItem value="Solutions Architect">Solutions Architect</SelectItem>
                <SelectItem value="Cloud Architect">Cloud Architect</SelectItem>
                <SelectItem value="Enterprise Architect">Enterprise Architect</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="level-filter" className="text-sm font-medium mb-2 block">
              Filter by Job Level
            </Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger id="level-filter">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allLevels">All Levels</SelectItem>
                <SelectItem value="Intern">Intern</SelectItem>
                <SelectItem value="Entry-Level">Entry Level (0-1 years)</SelectItem>
                <SelectItem value="Junior">Junior (1-3 years)</SelectItem>
                <SelectItem value="Mid-Level">Mid-Level (3-5 years)</SelectItem>
                <SelectItem value="Senior">Senior (5-8 years)</SelectItem>
                <SelectItem value="Lead">Lead (8-10 years)</SelectItem>
                <SelectItem value="Staff">Staff Engineer (10-12 years)</SelectItem>
                <SelectItem value="Principal">Principal Engineer (12-15 years)</SelectItem>
                <SelectItem value="Distinguished">Distinguished Engineer</SelectItem>
                <SelectItem value="Architect">Architect (15+ years)</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                <SelectItem value="Director">Director</SelectItem>
                <SelectItem value="Senior Director">Senior Director</SelectItem>
                <SelectItem value="VP">VP of Engineering</SelectItem>
                <SelectItem value="CTO">CTO/C-Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="proficiency-filter" className="text-sm font-medium mb-2 block">
              Filter by Proficiency
            </Label>
            <Select value={selectedProficiency} onValueChange={setSelectedProficiency}>
              <SelectTrigger id="proficiency-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Proficiency Levels</SelectItem>
                <SelectItem value="beginner">Beginner (Score 1.0-2.0)</SelectItem>
                <SelectItem value="intermediate">Intermediate (Score 2.0-3.0)</SelectItem>
                <SelectItem value="advanced">Advanced (Score 3.0-4.0)</SelectItem>
                <SelectItem value="expert">Expert (Score 4.0-5.0)</SelectItem>
                <SelectItem value="needsImprovement">Needs Improvement (Below 2.5)</SelectItem>
                <SelectItem value="jobReady">Job Ready (Above 3.5)</SelectItem>
                <SelectItem value="master">Master Level (4.5-5.0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(selectedRole !== "allRoles" || selectedLevel !== "allLevels" || selectedProficiency !== "all") && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRole("allRoles")
                setSelectedLevel("allLevels")
                setSelectedProficiency("all")
              }}
              className="text-xs gap-2"
            >
              ✕ Clear All Filters
            </Button>
          </div>
        )}

        {/* Charts Section */}
        <div className="space-y-6 mb-8">
          {/* Chart 1: Proficiency vs Market Demand */}
          <Card className="glass p-6">
            <div className="overflow-x-auto">
              <div className="flex flex-row gap-6 min-w-full">
                {/* Chart Container - 70% */}
                <div className="flex-[0.7] shrink-0 min-w-[600px]">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Proficiency Gap Analysis</h2>
                  <div className="w-full min-h-[280px]">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart
                        data={radarData.filter((_, i) => i < 10).sort((a, b) => a.proficiency - b.proficiency)}
                      >
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="name" stroke="#E5E5E5" />
                        <PolarRadiusAxis stroke="#E5E5E5" />
                        <Radar
                          name="Your Proficiency"
                          dataKey="proficiency"
                          stroke="#22D3EE"
                          fill="#22D3EE"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Radar
                          name="Market Demand"
                          dataKey="marketDemand"
                          stroke="#FB923C"
                          fill="#FB923C"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Info Panel - 30% */}
                <div className="flex-[0.3] shrink-0 min-w-[250px] flex flex-col gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-foreground">Key Metrics</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Average Proficiency</span>
                      <span className="text-sm font-semibold text-cyan-400">
                        {currentSkills.length > 0
                          ? (currentSkills.reduce((sum, skill) => sum + (skill.proficiency ?? 0), 0) / currentSkills.length).toFixed(1)
                          : "0.0"}/5.0
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Skills Below Market</span>
                      <span className="text-sm font-semibold text-orange-400">
                        {currentSkills.filter(skill => {
                          const skillAny = skill as any
                          const normalizedDemand = (skillAny.marketDemand ?? 0) / 20
                          return (skill.proficiency ?? 0) < normalizedDemand
                        }).length} skills
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Improvement Priority</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {(() => {
                          const sorted = [...currentSkills]
                            .filter(s => s.proficiency && (s as any).marketDemand)
                            .sort((a, b) => {
                              const aAny = a as any
                              const bAny = b as any
                              const gapA = (aAny.marketDemand ?? 0) / 20 - (a.proficiency ?? 0)
                              const gapB = (bAny.marketDemand ?? 0) / 20 - (b.proficiency ?? 0)
                              return gapB - gapA
                            })
                          return sorted[0]?.name ?? "N/A"
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Market Alignment</span>
                      <span className="text-sm font-semibold text-green-400">
                        {currentSkills.length > 0
                          ? Math.round((currentSkills.filter(skill => {
                              const skillAny = skill as any
                              const normalizedDemand = (skillAny.marketDemand ?? 0) / 20
                              return (skill.proficiency ?? 0) >= normalizedDemand * 0.8
                            }).length / currentSkills.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3 mt-2">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Insights</h4>
                    <ul className="space-y-1 text-xs text-foreground/70">
                      {(() => {
                        // Calculate dynamic insights from currentSkills
                        const skillsWithGaps = currentSkills
                          .filter(s => s.proficiency && (s as any).marketDemand)
                          .map(s => ({
                            ...s,
                            gap: ((s as any).marketDemand ?? 0) / 20 - (s.proficiency ?? 0)
                          }))
                          .sort((a, b) => b.gap - a.gap)

                        const biggestGapSkill = skillsWithGaps[0]
                        const strongestSkill = [...currentSkills].sort((a, b) => (b.proficiency ?? 0) - (a.proficiency ?? 0))[0]
                        const highestDemandSkill = [...currentSkills].sort((a, b) => ((b as any).marketDemand ?? 0) - ((a as any).marketDemand ?? 0))[0]

                        return (
                          <>
                            {biggestGapSkill && (
                              <li>• Focus on {biggestGapSkill.name} - {biggestGapSkill.gap.toFixed(1)} point gap</li>
                            )}
                            {strongestSkill && (
                              <li>• {strongestSkill.name} exceeds market by {(((strongestSkill.proficiency ?? 0) / ((strongestSkill as any).marketDemand ?? 1) * 100) - 100).toFixed(0)}%</li>
                            )}
                            {highestDemandSkill && (
                              <li>• Prioritize {highestDemandSkill.name} - {((highestDemandSkill as any).marketDemand ?? 0)}/100 demand</li>
                            )}
                          </>
                        )
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Chart 2: Market Demand Intelligence */}
          <Card className="glass p-6">
            <div className="">
              <div className="flex flex-row gap-6 min-w-full">
                {/* Chart Container - 70% */}
                <div className="flex-[0.7] shrink-0 min-w-[600px]">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Market Demand Intelligence</h2>
                  <div className="w-full min-h-[320px]">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="month" stroke="#E5E5E5" />
                        <YAxis stroke="#E5E5E5" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        {/* Dynamically render lines for top skills */}
                        {currentSkills
                          .sort((a, b) => ((b as any).marketDemand ?? 0) - ((a as any).marketDemand ?? 0))
                          .slice(0, 15)
                          .map((skill, index) => {
                            const colors = ["#22D3EE", "#FB923C", "#A78BFA", "#34D399", "#F87171", "#FBBF24", "#60A5FA", "#F472B6", "#EC4899", "#06B6D4", "#EF4444", "#8B5CF6", "#14B8A6", "#F59E0B", "#6366F1"]
                            return (
                              <Line
                                key={skill.name}
                                type="monotone"
                                dataKey={skill.name}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                              />
                            )
                          })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Info Panel - 30% */}
                <div className="flex-[0.3] shrink-0 min-w-[250px] flex flex-col gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-foreground">Market Trends</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Trending Up</span>
                      <span className="text-sm font-semibold text-green-400">
                        {currentSkills.filter(s => (s as any).trend === "up").length} skills
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Declining</span>
                      <span className="text-sm font-semibold text-red-400">
                        {currentSkills.filter(s => (s as any).trend === "down").length} skills
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Your Coverage</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {(() => {
                          const topSkills = currentSkills
                            .sort((a, b) => ((b as any).marketDemand ?? 0) - ((a as any).marketDemand ?? 0))
                            .slice(0, 10)
                          const yourSkills = topSkills.filter(s => (s.proficiency ?? 0) >= 3.0)
                          return topSkills.length > 0 ? Math.round((yourSkills.length / topSkills.length) * 100) : 0
                        })()}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/70">Fastest Growing</span>
                      <span className="text-sm font-semibold text-cyan-400">
                        {(() => {
                          const upTrending = currentSkills
                            .filter(s => (s as any).trend === "up")
                            .sort((a, b) => ((b as any).marketDemand ?? 0) - ((a as any).marketDemand ?? 0))
                          return upTrending[0]?.name ?? "N/A"
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Insights</h4>
                    <ul className="space-y-1 text-xs text-foreground/70">
                      {(() => {
                        // Calculate dynamic insights from currentSkills
                        const skillsWithGaps = currentSkills
                          .filter(s => s.proficiency && (s as any).marketDemand)
                          .map(s => ({
                            ...s,
                            gap: ((s as any).marketDemand ?? 0) / 20 - (s.proficiency ?? 0)
                          }))
                          .sort((a, b) => b.gap - a.gap)

                        const biggestGapSkill = skillsWithGaps[0]
                        const strongestSkill = [...currentSkills].sort((a, b) => (b.proficiency ?? 0) - (a.proficiency ?? 0))[0]
                        const highestDemandSkill = [...currentSkills].sort((a, b) => ((b as any).marketDemand ?? 0) - ((a as any).marketDemand ?? 0))[0]

                        return (
                          <>
                            {biggestGapSkill && (
                              <li>• Focus on {biggestGapSkill.name} - {biggestGapSkill.gap.toFixed(1)} point gap</li>
                            )}
                            {strongestSkill && (
                              <li>• {strongestSkill.name} exceeds market by {(((strongestSkill.proficiency ?? 0) / ((strongestSkill as any).marketDemand ?? 1) * 100) - 100).toFixed(0)}%</li>
                            )}
                            {highestDemandSkill && (
                              <li>• Prioritize {highestDemandSkill.name} - {((highestDemandSkill as any).marketDemand ?? 0)}/100 demand</li>
                            )}
                          </>
                        )
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Proficiency Level Distribution chart with horizontal layout */}
          <Card className="glass p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Proficiency Level Distribution</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section - 70% */}
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={proficiencyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.1)" }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]}>
                      {proficiencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Info Panel - 30% */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Proficiency Overview</h3>
                  <div className="space-y-3">
                    {proficiencyDistribution.map((level, index) => {
                      const total = proficiencyDistribution.reduce((sum, item) => sum + item.count, 0)
                      const percentage = total > 0 ? ((level.count / total) * 100).toFixed(0) : "0"
                      return (
                        <div key={level.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/70">{level.name}</span>
                            <span className="font-semibold text-foreground">
                              {level.count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index],
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Analysis</h3>
                  <ul className="space-y-2 text-sm">
                    {(() => {
                      const expert = proficiencyDistribution.find(d => d.name === "Expert")?.count ?? 0
                      const advanced = proficiencyDistribution.find(d => d.name === "Advanced")?.count ?? 0
                      const intermediate = proficiencyDistribution.find(d => d.name === "Intermediate")?.count ?? 0
                      const total = currentSkills.length

                      const messages: React.ReactElement[] = []

                      if (expert > 0) {
                        messages.push(
                          <li key="expert" className="flex gap-2">
                            <span className="text-yellow-400">🏆</span>
                            <span className="text-foreground/80">Strong foundation with {expert} expert skill{expert > 1 ? 's' : ''}</span>
                          </li>
                        )
                      }

                      if (intermediate >= advanced) {
                        messages.push(
                          <li key="intermediate" className="flex gap-2">
                            <span className="text-blue-400">🎯</span>
                            <span className="text-foreground/80">Focus on advancing intermediate skills</span>
                          </li>
                        )
                      }

                      if (advanced + expert >= total * 0.5) {
                        messages.push(
                          <li key="balanced" className="flex gap-2">
                            <span className="text-green-400">📈</span>
                            <span className="text-foreground/80">Well-balanced skill portfolio</span>
                          </li>
                        )
                      } else if (intermediate >= total * 0.4) {
                        messages.push(
                          <li key="base" className="flex gap-2">
                            <span className="text-green-400">📈</span>
                            <span className="text-foreground/80">Good intermediate base, focus on specialization</span>
                          </li>
                        )
                      }

                      return messages.length > 0 ? messages : (
                        <li className="flex gap-2">
                          <span className="text-blue-400">📚</span>
                          <span className="text-foreground/80">Continue building your skill base</span>
                        </li>
                      )
                    })()}
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Skills Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Extracted Skills{" "}
                {selectedRole !== "allRoles" || selectedLevel !== "allLevels" || selectedProficiency !== "all"
                  ? `(Top 50 of ${currentSkills.length} - ${getFilteredTrendsSkills().length} filtered)`
                  : `(Top 50 of ${currentSkills.length})`}
              </h2>
            </div>
            <div className="space-y-4">
              {displayedSkills.map((skill) => (
                <div key={skill.id} id={`skill-card-${skill.id}`}>
                  <SkillCard
                    skill={skill as any}
                    onEdit={handleEditSkill}
                    onDelete={handleDeleteSkill}
                    onViewAnalysis={handleViewSkillAnalysis}
                    candidateDetails={candidateDetails}
                    searchQuery={searchQuery}
                  />
                </div>
              ))}
            </div>

            {remaining > 0 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => setShowAll(!showAll)} className="gap-2">
                  {showAll ? "Show Less" : `Show All ${filteredSkills.length} Skills`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Gap Analysis Dialog */}
      <Dialog open={showGapAnalysis} onOpenChange={setShowGapAnalysis}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proficiency Gap Analysis</DialogTitle>
            <DialogDescription>
              Identify skills that need improvement based on market demand vs your current proficiency
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Display skills with low proficiency (below 3.0), sorted by gap size */}
            {filteredSkills
              .filter((skill) => (skill.proficiency ?? 0) < 3.0)
              .sort(
                (a, b) => {
                  const aAny = a as any
                  const bAny = b as any
                  return (bAny.marketDemand ?? 0) - (b.proficiency ?? 0) - ((aAny.marketDemand ?? 0) - (a.proficiency ?? 0))
                }
              )
              .slice(0, 10)
              .map((skill) => {
                const skillAny = skill as any
                const gapSize = calculateGapSize(skillAny.marketDemand, skill.proficiency)
                const estimatedHours = Math.round(gapSize * 50)
                return (
                  <div
                    key={skill.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-lg text-foreground">{skill.name}</h4>
                        <p className="text-sm text-foreground/70">{skill.category}</p>
                      </div>
                      <Badge className="bg-orange-500/20 text-orange-300">Gap: {gapSize.toFixed(1)}</Badge>
                    </div>

                    {/* Proficiency Score with Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/70">Current Proficiency</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatProficiency(skill.proficiency)}/5.0
                        </span>
                      </div>
                      <Progress value={((skill.proficiency ?? 0) / 5) * 100} className="h-2" />
                    </div>

                    {/* Market Demand */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-foreground/60">Market Demand Score</p>
                        <p className="font-semibold text-green-400">{(skill as any).marketDemand ?? 0}/100</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Gap Size</p>
                        <p className="font-semibold text-orange-400">{gapSize.toFixed(1)} points</p>
                      </div>
                    </div>

                    {/* Estimated Learning Time */}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-foreground/70 mb-1">Estimated Time to Bridge Gap</p>
                      <p className="text-sm font-semibold text-foreground">
                        {estimatedHours} hours ({Math.round(estimatedHours / 10)} weeks at 10 hrs/week)
                      </p>
                    </div>

                    {/* Recommended Resources */}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-foreground/70 mb-2">Recommended Resources</p>
                      <ul className="text-xs text-foreground/60 space-y-1">
                        <li>• Udemy: {skill.name} Masterclass</li>
                        <li>• Coursera: Advanced {skill.name}</li>
                        <li>• Practice: Build 2-3 projects</li>
                        <li>• Documentation: Official {skill.name} guides</li>
                      </ul>
                    </div>
                  </div>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Learning Goals Dialog */}
      <Dialog open={showSetGoalsDialog} onOpenChange={setShowSetGoalsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Learning Goals</DialogTitle>
            <DialogDescription>Create personalized learning goals for your selected skills</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            {/* Goal parameters section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-proficiency" className="text-sm font-medium mb-2 block">
                  Target Proficiency Level
                </Label>
                <Select
                  value={targetProficiency}
                  onValueChange={setTargetProficiency}
                >
                  <SelectTrigger id="target-proficiency">
                    <SelectValue placeholder="Select target proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeframe" className="text-sm font-medium mb-2 block">
                  Timeframe
                </Label>
                <Select
                  value={timeframe}
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger id="timeframe">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 month">1 Month</SelectItem>
                    <SelectItem value="3 months">3 Months</SelectItem>
                    <SelectItem value="6 months">6 Months</SelectItem>
                    <SelectItem value="1 year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time commitment slider */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Monthly Time Commitment (hours)
              </Label>
              <Slider
                value={[timeCommitment]}
                onValueChange={(value) => setTimeCommitment(value[0])}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-foreground/70">0 hrs</span>
                <span className="text-foreground/70">20+ hrs</span>
              </div>
            </div>

            {/* Selected skills list */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Selected Skills
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedSkillsForGoals.map((skillId) => {
                  const skill = currentSkills.find((s) => s.id === skillId)
                  return (
                    skill && (
                      <Badge
                        key={skill.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedSkillsForGoals(selectedSkillsForGoals.filter(id => id !== skill.id))
                        }}
                      >
                        {skill.name} <span className="text-muted-foreground">×</span>
                      </Badge>
                    )
                  )
                })}
              </div>
            </div>

            {/* Template suggestions */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Goal Templates
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goalTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyTemplate(template.id)}
                  >
                    <h4 className="font-semibold text-lg text-foreground mb-2">{template.name}</h4>
                    <p className="text-sm text-foreground/70 mb-4">{template.description}</p>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          applyTemplate(template.id)
                        }}
                      >
                        {selectedTemplate === template.id ? "Selected" : "Select Template"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button onClick={handleSubmitLearningGoals} className="w-full bg-primary mt-6">
              Create Learning Goals
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skill Card Analysis Dialog */}
      {selectedSkillForCardAnalysis && (
        <Dialog open={showSkillCardAnalysis} onOpenChange={setShowSkillCardAnalysis}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSkillForCardAnalysis?.name} - Detailed Analysis</DialogTitle>
              <DialogDescription>Comprehensive proficiency, market, and career impact analysis</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6">
              {/* Skill details */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Skill Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground/70">Category</p>
                    <p className="text-sm font-semibold text-foreground">{selectedSkillForCardAnalysis.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70">Proficiency</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatProficiency(selectedSkillForCardAnalysis.proficiency)}/5.0
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70">Market Demand</p>
                    <p className="text-sm font-semibold text-green-400">
                      {(selectedSkillForCardAnalysis as any).marketDemand ?? 0}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70">Trend</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedSkillForCardAnalysis.trend.charAt(0).toUpperCase() + selectedSkillForCardAnalysis.trend.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth potential */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Growth Potential</h4>
                <p className="text-sm text-foreground/70 mb-1">Estimated Growth Score</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${calculateGrowthPotential(selectedSkillForCardAnalysis)}%`,
                        backgroundColor: "var(--color-primary)",
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {calculateGrowthPotential(selectedSkillForCardAnalysis)}%
                  </span>
                </div>
                <p className="text-sm text-foreground/70 mt-2">
                  This score indicates the potential growth in your proficiency for this skill based on market trends and demand.
                </p>
              </div>

              {/* Career path recommendations */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Career Path Recommendations</h4>
                <div className="space-y-2">
                  {getCareerPathRecommendations().map((rec, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <h5 className="font-semibold text-foreground">{rec.skill}</h5>
                      <p className="text-sm text-foreground/70">{rec.reason}</p>
                      <p className="text-sm font-semibold text-green-400">{rec.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSkillCardAnalysis(false)}
                  className="gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Detailed Market Trends Dialog */}
      <Dialog open={showDetailedTrendsDialog} onOpenChange={setShowDetailedTrendsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detailed Market Trends Analysis</DialogTitle>
            <DialogDescription>
              Comprehensive view of skill demand trends and market positioning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">High Demand Skills</div>
                <div className="text-3xl font-bold text-green-500">
                  {currentSkills.filter(s => ((s as any).marketDemand ?? 0) > 80).length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">In your portfolio</div>
              </Card>
              
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Trending Up</div>
                <div className="text-3xl font-bold text-blue-500">
                  {currentSkills.filter(s => (s as any).trend === 'up').length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Growing skills</div>
              </Card>
              
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Market Alignment</div>
                <div className="text-3xl font-bold text-purple-500">
                  {Math.round(currentSkills.reduce((acc, s) => acc + (((s as any).marketDemand ?? 0) / 100), 0) / currentSkills.length * 100)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Overall match</div>
              </Card>
            </div>

            {/* Trending Skills Chart */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Trending Skills</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={
                  currentSkills
                    .filter(s => (s as any).marketDemand > 70)
                    .sort((a, b) => ((b as any).marketDemand ?? 0) - ((a as any).marketDemand ?? 0))
                    .slice(0, 10)
                    .map(s => ({
                      name: s.name,
                      demand: (s as any).marketDemand ?? 0,
                      proficiency: (s.proficiency ?? 0) * 20
                    }))
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demand" fill="#22c55e" name="Market Demand" />
                  <Bar dataKey="proficiency" fill="#3b82f6" name="Your Proficiency" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Skills by Trend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending Up
                </h4>
                <div className="space-y-2">
                  {currentSkills
                    .filter(s => (s as any).trend === 'up')
                    .slice(0, 5)
                    .map(s => (
                      <div key={s.id} className="text-sm p-2 bg-green-50 dark:bg-green-950 rounded">
                        {s.name}
                      </div>
                    ))
                  }
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Stable
                </h4>
                <div className="space-y-2">
                  {currentSkills
                    .filter(s => (s as any).trend === 'stable')
                    .slice(0, 5)
                    .map(s => (
                      <div key={s.id} className="text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        {s.name}
                      </div>
                    ))
                }
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 rotate-180" />
                  Declining
                </h4>
                <div className="space-y-2">
                  {currentSkills
                    .filter(s => (s as any).trend === 'down')
                    .slice(0, 5)
                    .map(s => (
                      <div key={s.id} className="text-sm p-2 bg-orange-50 dark:bg-orange-950 rounded">
                        {s.name}
                      </div>
                    ))
                }
                </div>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this skill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction 
            onClick={confirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Skill
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

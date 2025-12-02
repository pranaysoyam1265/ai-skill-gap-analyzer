"use client"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"
import { LoadingDialog } from "@/components/loading-dialog"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Trophy, Clock, Zap, Map } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { AddCourseModal } from "@/components/add-course-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CreateRoadmapModal } from "@/components/learning/create-roadmap-modal"
import { AchievementsBadge } from "@/components/learning/achievements-badge"
import { CourseSection } from "@/components/learning/course-section"
import { AdvancedRoadmapCard } from "@/components/learning/advanced-roadmap-card"
import { calculateAchievements } from "@/lib/achievements-calculator"
import { useLearningPathStore } from "@/lib/stores/learning-path-store"

interface Course {
  id: string
  title: string
  platform: string
  totalHours: number
  studiedHours: number
  progress: number
  status: "not-started" | "in-progress" | "completed" | "paused" | "dropped"
  targetDate?: string
  notes?: string
  rating?: number
}

interface Goal {
  id: string
  skill: string
  source: "gap-analysis" | "dashboard"
  proficiency?: number
  targetDate?: string
  status: "active" | "completed" | "paused"
  description?: string
  category?: string
  timeCommitment?: string
}

interface Roadmap {
  id: string
  title: string
  skill: string
  status: "active" | "completed" | "paused" | "ready" // Added "ready" status
  phases: RoadmapPhase[]
  startDate: string
  targetDate: string
}

interface RoadmapPhase {
  id: string
  name: string
  duration: string
  objectives: string[]
  resources: string[]
  completed: boolean
}

interface ActionPlanItem {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  steps: string[]
  resources: string[]
  completed: boolean
}

interface SkillForRoadmap {
  id: string
  skill: string
  proficiency: number
  startDate?: string
  endDate?: string
  timeCommitment?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: "trophy" | "star" | "zap" | "target" | "book" | "flame"
  unlocked: boolean
  unlockedDate?: string
}

const mockCourses: Course[] = [
  {
    id: "1",
    title: "Advanced React Patterns",
    platform: "Udemy",
    progress: 65,
    status: "in-progress",
    targetDate: "2025-12-15",
    notes: "Focus on hooks, context API, and performance optimization",
    totalHours: 40,
    studiedHours: 26,
  },
  {
    id: "2",
    title: "TypeScript Masterclass",
    platform: "Coursera",
    progress: 100,
    status: "completed",
    targetDate: "2025-10-20",
    notes: "Completed with distinction. Great course on advanced types",
    rating: 5,
    totalHours: 35,
    studiedHours: 35,
  },
  {
    id: "3",
    title: "System Design Interview",
    platform: "Educative",
    progress: 30,
    status: "in-progress",
    targetDate: "2026-01-30",
    notes: "Preparing for FAANG interviews. Focus on scalability patterns",
    totalHours: 50,
    studiedHours: 15,
  },
  {
    id: "4",
    title: "AWS Solutions Architect",
    platform: "LinkedIn Learning",
    progress: 45,
    status: "in-progress",
    targetDate: "2025-11-30",
    notes: "Preparing for SAA-C03 certification exam",
    totalHours: 55,
    studiedHours: 24,
  },
  {
    id: "5",
    title: "Python for Data Science",
    platform: "edX",
    progress: 100,
    status: "completed",
    targetDate: "2025-09-10",
    notes: "Excellent coverage of pandas, numpy, and matplotlib",
    rating: 4,
    totalHours: 45,
    studiedHours: 45,
  },
  {
    id: "6",
    title: "Docker & Kubernetes Mastery",
    platform: "Pluralsight",
    progress: 55,
    status: "in-progress",
    targetDate: "2025-12-20",
    notes: "Deep dive into container orchestration and microservices",
    totalHours: 42,
    studiedHours: 23,
  },
  {
    id: "7",
    title: "GraphQL Fundamentals",
    platform: "Frontend Masters",
    progress: 20,
    status: "paused",
    targetDate: "2026-02-15",
    notes: "Paused to focus on React. Will resume next month",
    totalHours: 28,
    studiedHours: 6,
  },
  {
    id: "8",
    title: "Node.js Advanced Concepts",
    platform: "Udemy",
    progress: 80,
    status: "in-progress",
    targetDate: "2025-11-10",
    notes: "Great insights on event loop, clustering, and performance",
    totalHours: 38,
    studiedHours: 30,
  },
  {
    id: "9",
    title: "Machine Learning A-Z",
    platform: "Udemy",
    progress: 15,
    status: "in-progress",
    targetDate: "2026-03-15",
    notes: "Just started. Covers supervised and unsupervised learning",
    totalHours: 60,
    studiedHours: 9,
  },
  {
    id: "10",
    title: "Next.js 14 Complete Guide",
    platform: "Udemy",
    progress: 90,
    status: "in-progress",
    targetDate: "2025-10-30",
    notes: "Almost done. App router and server components are amazing",
    totalHours: 32,
    studiedHours: 29,
  },
  {
    id: "11",
    title: "PostgreSQL Performance Tuning",
    platform: "Pluralsight",
    progress: 0,
    status: "not-started",
    targetDate: "2026-04-01",
    notes: "Scheduled to start after completing current courses",
    totalHours: 25,
    studiedHours: 0,
  },
  {
    id: "12",
    title: "Tailwind CSS Mastery",
    platform: "Frontend Masters",
    progress: 100,
    status: "completed",
    targetDate: "2025-08-15",
    notes: "Essential for modern web development. Utility-first approach is brilliant",
    rating: 5,
    totalHours: 18,
    studiedHours: 18,
  },
  {
    id: "13",
    title: "CI/CD with Jenkins & GitHub Actions",
    platform: "LinkedIn Learning",
    progress: 40,
    status: "in-progress",
    targetDate: "2025-12-05",
    notes: "Learning pipeline automation and deployment strategies",
    totalHours: 30,
    studiedHours: 12,
  },
]

const mockGoals: Goal[] = [
  {
    id: "g1",
    skill: "System Design",
    source: "gap-analysis",
    proficiency: 40,
    targetDate: "2026-01-30",
    status: "active",
    description: "Master system design patterns for FAANG interviews",
    category: "Software Architecture",
    timeCommitment: "10 hours/week",
  },
  {
    id: "g2",
    skill: "Cloud Architecture",
    source: "gap-analysis",
    proficiency: 35,
    targetDate: "2025-12-15",
    status: "active",
    description: "AWS Solutions Architect certification",
    category: "Cloud Computing",
    timeCommitment: "8 hours/week",
  },
  {
    id: "g3",
    skill: "Leadership",
    source: "dashboard",
    proficiency: 60,
    targetDate: "2026-06-30",
    status: "active",
    description: "Develop team leadership and mentoring skills",
    category: "Soft Skills",
    timeCommitment: "5 hours/week",
  },
]

const mockRoadmaps: Roadmap[] = [
  {
    id: "r1",
    title: "React Mastery Roadmap",
    skill: "Advanced React",
    status: "active",
    startDate: "2025-10-01",
    targetDate: "2026-03-31",
    phases: [
      {
        id: "p1",
        name: "Fundamentals Review",
        duration: "2 weeks",
        objectives: ["Review hooks", "Master context API", "Understand fiber architecture"],
        resources: ["React Docs", "Epic React Course"],
        completed: true,
      },
      {
        id: "p2",
        name: "Advanced Patterns",
        duration: "4 weeks",
        objectives: ["Render props", "Custom hooks", "Compound components"],
        resources: ["Advanced React Patterns", "React Query"],
        completed: false,
      },
      {
        id: "p3",
        name: "Performance Optimization",
        duration: "3 weeks",
        objectives: ["Code splitting", "Lazy loading", "Memoization strategies"],
        resources: ["React Performance", "Web Vitals"],
        completed: false,
      },
    ],
  },
]

const mockActionPlan: ActionPlanItem[] = [
  {
    id: "ap1",
    title: "Complete React Patterns Course",
    description: "Finish the Advanced React Patterns course on Udemy",
    priority: "high",
    steps: ["Complete hooks module", "Master context API", "Learn performance optimization"],
    resources: ["Udemy Course", "React Documentation"],
    completed: false,
  },
  {
    id: "ap2",
    title: "Build a Full-Stack Project",
    description: "Create a production-ready React application with backend",
    priority: "high",
    steps: ["Design architecture", "Setup database", "Implement API", "Build UI", "Deploy"],
    resources: ["Next.js Docs", "PostgreSQL", "Vercel"],
    completed: false,
  },
  {
    id: "ap3",
    title: "Practice System Design",
    description: "Solve 10 system design problems",
    priority: "medium",
    steps: ["Study patterns", "Practice problems", "Review solutions"],
    resources: ["System Design Interview", "LeetCode"],
    completed: false,
  },
]

const mockSkillsForRoadmap: SkillForRoadmap[] = [
  {
    id: "sfr1",
    skill: "TypeScript Advanced",
    proficiency: 50,
  },
  {
    id: "sfr2",
    skill: "Database Design",
    proficiency: 40,
  },
]

const mockAchievements: Achievement[] = [
  {
    id: "a1",
    title: "First Course",
    description: "Complete your first course",
    icon: "book",
    unlocked: true,
    unlockedDate: "2025-08-15",
  },
  {
    id: "a2",
    title: "Goal Setter",
    description: "Create your first learning goal",
    icon: "target",
    unlocked: true,
    unlockedDate: "2025-09-01",
  },
  {
    id: "a3",
    title: "Roadmap Builder",
    description: "Create your first roadmap",
    icon: "zap",
    unlocked: true,
    unlockedDate: "2025-10-01",
  },
  {
    id: "a4",
    title: "5 Courses",
    description: "Complete 5 courses",
    icon: "trophy",
    unlocked: false,
  },
  {
    id: "a5",
    title: "100 Hours",
    description: "Study for 100 hours",
    icon: "flame",
    unlocked: false,
  },
  {
    id: "a6",
    title: "Mastery",
    description: "Reach 90% proficiency in a skill",
    icon: "star",
    unlocked: false,
  },
]

export default function LearningPathPage() {
  const coursesFromStore = useLearningPathStore((state) => state.courses)
  const roadmapsFromStore = useLearningPathStore((state) => state.roadmaps)
  const [hydratedCourses, setHydratedCourses] = useState<Course[] | undefined>()
  const [hydratedRoadmaps, setHydratedRoadmaps] = useState<Roadmap[] | undefined>()
  const [showLoadingDialog, setShowLoadingDialog] = useState(true)
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>(mockActionPlan)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCreateRoadmapOpen, setIsCreateRoadmapOpen] = useState(false)
  const [selectedSkillForRoadmapCreation, setSelectedSkillForRoadmapCreation] = useState<SkillForRoadmap | null>(null)
  const { toast } = useToast()
  const [skillsForRoadmap, setSkillsForRoadmap] = useState<SkillForRoadmap[]>(mockSkillsForRoadmap) // Declare skillsForRoadmap variable
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null) // Declare selectedRoadmapId variable

  useEffect(() => {
    // Loading initialization
  }, [])

  useEffect(() => {
    if (coursesFromStore !== undefined) {
      setHydratedCourses(coursesFromStore)
    }
  }, [coursesFromStore])

  useEffect(() => {
    if (roadmapsFromStore !== undefined) {
      setHydratedRoadmaps(roadmapsFromStore)
    }
  }, [roadmapsFromStore])

  const achievements = useMemo(() => {
    return calculateAchievements(hydratedCourses || [], goals, hydratedRoadmaps || [])
  }, [hydratedCourses, goals, hydratedRoadmaps])

  const stats = {
    inProgress: (hydratedCourses || []).filter((c) => c.status === "in-progress").length,
    completed: (hydratedCourses || []).filter((c) => c.status === "completed").length,
    activeGoalsAndRoadmaps:
      goals.filter((g) => g.status === "active").length +
      (hydratedRoadmaps || []).filter((r) => r.status === "active").length,
    streak: 12,
  }

  const handleAddCourse = (newCourse: Omit<Course, "id">) => {
    try {
      const course: Course = {
        ...newCourse,
        id: Date.now().toString(),
      }
      setHydratedCourses([...(hydratedCourses || []), course])
      setIsAddModalOpen(false)

      toast.success(`Course added: ${newCourse.title}`, {
        duration: 3000,
      })

      document.querySelector('[value="courses"]')?.click()
    } catch (error) {
      console.error("[v0] Error adding course:", error)
      toast.error("Failed to add course. Please try again.", {
        duration: 3000,
      })
    }
  }

  const handleUpdateCourse = (id: string, updates: Partial<Course>) => {
    setHydratedCourses((hydratedCourses || []).map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const handleRemoveCourse = (id: string) => {
    try {
      const courseToRemove = (hydratedCourses || []).find((c) => c.id === id)
      setHydratedCourses((hydratedCourses || []).filter((c) => c.id !== id))

      toast({
        title: "🗑️ Course Removed",
        description: `"${courseToRemove?.title}" has been removed from your learning path.`,
      })
    } catch (error) {
      console.error("[v0] Error removing course:", error)
      toast({
        title: "Error",
        description: "Failed to remove course. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateRoadmapClick = (skill: SkillForRoadmap) => {
    setSelectedSkillForRoadmapCreation(skill)
    setIsCreateRoadmapOpen(true)
  }

  const handleRoadmapCreation = (data: any) => {
    try {
      if (selectedSkillForRoadmapCreation) {
        const newRoadmap: Roadmap = {
          id: `r${Date.now()}`,
          title: `${selectedSkillForRoadmapCreation.skill} Roadmap`,
          skill: selectedSkillForRoadmapCreation.skill,
          status: "ready", // Set initial status to "ready"
          startDate: data.startDate,
          targetDate: data.endDate,
          phases: [
            {
              id: "p1",
              name: "Foundation",
              duration: "2 weeks",
              objectives: ["Learn basics", "Setup environment"],
              resources: ["Documentation", "Tutorials"],
              completed: false,
            },
            {
              id: "p2",
              name: "Core Concepts",
              duration: "4 weeks",
              objectives: ["Master key concepts", "Practice exercises"],
              resources: ["Courses", "Practice problems"],
              completed: false,
            },
            {
              id: "p3",
              name: "Advanced Topics",
              duration: "3 weeks",
              objectives: ["Deep dive", "Real-world projects"],
              resources: ["Advanced courses", "Project ideas"],
              completed: false,
            },
          ],
        }
        // Add roadmap to store instead of local state
        useLearningPathStore.setState((state) => ({
          roadmaps: [...state.roadmaps, newRoadmap],
        }))
        setSkillsForRoadmap(skillsForRoadmap.filter((s) => s.id !== selectedSkillForRoadmapCreation.id))
        setIsCreateRoadmapOpen(false)
        setSelectedSkillForRoadmapCreation(null)

        toast({
          title: "✨ Roadmap Ready",
          description: `Your roadmap for "${selectedSkillForRoadmapCreation.skill}" is ready to start.`,
          action: {
            label: "View",
            onClick: () => {
              document.querySelector('[value="roadmaps"]')?.click()
            },
          },
        })
      }
    } catch (error) {
      console.error("[v0] Error creating roadmap:", error)
      toast({
        title: "Error",
        description: "Failed to create roadmap. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRoadmapStatusChange = (roadmapId: string, status: "active" | "paused") => {
    try {
      const roadmap = (hydratedRoadmaps || []).find((r) => r.id === roadmapId)
      useLearningPathStore.setState((state) => ({
        roadmaps: state.roadmaps.map((r) => (r.id === roadmapId ? { ...r, status } : r)),
      }))

      const statusEmoji = status === "active" ? "▶️" : "⏸️"
      toast({
        title: `${statusEmoji} Roadmap ${status === "active" ? "Resumed" : "Paused"}`,
        description: `Progress for "${roadmap?.skill}" has been ${status === "active" ? "resumed" : "saved"}.`,
      })
    } catch (error) {
      console.error("[v0] Error updating roadmap status:", error)
      toast({
        title: "Error",
        description: "Failed to update roadmap status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRoadmap = (roadmapId: string) => {
    try {
      const roadmap = (hydratedRoadmaps || []).find((r) => r.id === roadmapId)
      useLearningPathStore.setState((state) => ({
        roadmaps: state.roadmaps.filter((r) => r.id !== roadmapId),
      }))

      toast({
        title: "🗑️ Roadmap Deleted",
        description: `The roadmap for "${roadmap?.skill}" has been removed.`,
      })
    } catch (error) {
      console.error("[v0] Error deleting roadmap:", error)
      toast({
        title: "Error",
        description: "Failed to delete roadmap. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePhaseToggle = (roadmapId: string, phaseId: string, completed: boolean) => {
    useLearningPathStore.setState((state) => ({
      roadmaps: state.roadmaps.map((r) =>
        r.id === roadmapId
          ? {
              ...r,
              phases: r.phases.map((p) => (p.id === phaseId ? { ...p, completed } : p)),
            }
          : r,
      ),
    }))
  }

  const handleCompleteActionItem = (id: string) => {
    setActionPlan(actionPlan.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  const handleSelectRoadmap = (roadmapId: string) => {
    setSelectedRoadmapId(roadmapId)
  }

  return (
    <>
      <LoadingDialog
        isOpen={showLoadingDialog}
        title="Generating Learning Path"
        message="Building your personalized learning path..."
        onComplete={() => {
          setShowLoadingDialog(false)
        }}
      />
      {showLoadingDialog ? null : (
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Learning Path</h1>
          <p className="text-muted-foreground">Track your courses, manage goals, and build strategic roadmaps</p>
        </div>

        {hydratedCourses === undefined ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Courses In Progress"
                value={stats.inProgress.toString()}
                icon={BookOpen}
                color="from-blue-500 to-blue-600"
              />
              <StatCard
                label="Courses Completed"
                value={stats.completed.toString()}
                icon={Trophy}
                color="from-green-500 to-green-600"
              />
              <StatCard
                label="Active Goals & Roadmaps"
                value={stats.activeGoalsAndRoadmaps.toString()}
                icon={Zap}
                color="from-purple-500 to-purple-600"
              />
              <StatCard
                label="Learning Streak"
                value={`${stats.streak}d`}
                icon={Clock}
                color="from-orange-500 to-orange-600"
              />
            </div>

            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
                <TabsTrigger value="courses" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Current Courses
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-1">
                    {hydratedCourses?.length || 0}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger value="roadmaps" className="gap-2">
                  <Map className="w-4 h-4" />
                  Roadmaps
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-1">
                    {hydratedRoadmaps?.filter((r) => r.status !== 'ready').length || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses">
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Your Courses</h2>
                    <Button onClick={() => setIsAddModalOpen(true)}>Add Course</Button>
                  </div>

                  {(hydratedCourses || []).length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-12 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No courses found</p>
                      <Button onClick={() => setIsAddModalOpen(true)}>Add Your First Course</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CourseSection
                        status="in-progress"
                        courses={(hydratedCourses || []).filter((c) => c.status === "in-progress")}
                        onUpdate={handleUpdateCourse}
                        onRemove={handleRemoveCourse}
                        onStatusChange={(id, status) => handleUpdateCourse(id, { status })}
                      />
                      <CourseSection
                        status="not-started"
                        courses={(hydratedCourses || []).filter((c) => c.status === "not-started")}
                        onUpdate={handleUpdateCourse}
                        onRemove={handleRemoveCourse}
                        onStatusChange={(id, status) => handleUpdateCourse(id, { status })}
                      />
                      <CourseSection
                        status="paused"
                        courses={(hydratedCourses || []).filter((c) => c.status === "paused")}
                        onUpdate={handleUpdateCourse}
                        onRemove={handleRemoveCourse}
                        onStatusChange={(id, status) => handleUpdateCourse(id, { status })}
                      />
                      <CourseSection
                        status="completed"
                        courses={(hydratedCourses || []).filter((c) => c.status === "completed")}
                        onUpdate={handleUpdateCourse}
                        onRemove={handleRemoveCourse}
                        onStatusChange={(id, status) => handleUpdateCourse(id, { status })}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="roadmaps">
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Generated Roadmaps Section */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Generated Roadmaps</h2>
                    {hydratedRoadmaps === undefined ? (
                      <Card className="border-dashed">
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground">Loading roadmaps...</p>
                        </CardContent>
                      </Card>
                    ) : (hydratedRoadmaps || []).filter((r) => r.status !== "ready").length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground mb-4">No active roadmaps yet</p>
                          <p className="text-sm text-muted-foreground">
                            Create a roadmap from your goals or start a ready one.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {(hydratedRoadmaps || [])
                          .filter((r) => r.status !== "ready" && r.phases && Array.isArray(r.phases))
                          .map((roadmap) => (
                            <div
                              key={roadmap.id}
                              onClick={() => setSelectedRoadmapId(roadmap.id)}
                              className={`cursor-pointer transition-all ${
                                selectedRoadmapId === roadmap.id ? "ring-2 ring-blue-500 rounded-lg" : ""
                              }`}
                            >
                              <AdvancedRoadmapCard
                                roadmap={roadmap}
                                onPhaseToggle={(phaseId, completed) => handlePhaseToggle(roadmap.id, phaseId, completed)}
                                onStatusChange={(status) => handleRoadmapStatusChange(roadmap.id, status)}
                                onDelete={() => handleDeleteRoadmap(roadmap.id)}
                                onViewActionPlan={() => {
                                  setSelectedRoadmapId(roadmap.id)
                                  toast({
                                    title: "Action Plan",
                                    description: `Displaying action plan for ${roadmap.title}.`,
                                  })
                                }}
                                isSelected={selectedRoadmapId === roadmap.id}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Ready for a Roadmap Section */}
                  {hydratedRoadmaps !== undefined &&
                    (hydratedRoadmaps || []).filter((r) => r.status === "ready").length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Ready for a Roadmap</h2>
                        <div className="grid gap-4">
                          {(hydratedRoadmaps || [])
                            .filter((r) => r.status === "ready")
                            .map((roadmap) => (
                              <Card key={roadmap.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-lg mb-2">{roadmap.skill}</h3>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        Ready to begin learning roadmap
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        useLearningPathStore.setState((state) => ({
                                          roadmaps: state.roadmaps.map((r) =>
                                            r.id === roadmap.id ? { ...r, status: "active" as const } : r,
                                          ),
                                        }))
                                      }}
                                    >
                                      Start Roadmap
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Your Action Plan Section */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Your Action Plan</h2>
                    {!selectedRoadmapId ? (
                      <Card className="border-dashed">
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground mb-4">Select a roadmap to see your action plan</p>
                          <p className="text-sm text-muted-foreground">
                            Click on a roadmap above to generate personalized action items
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      (() => {
                        const selectedRoadmap = (hydratedRoadmaps || []).find((r) => r.id === selectedRoadmapId)
                        const generatedActionItems = selectedRoadmap
                          ? selectedRoadmap.phases.map((phase, index) => ({
                              id: `${selectedRoadmapId}-phase-${phase.id}`,
                              title: phase.name,
                              description: `Complete the ${phase.name} phase (${phase.duration})`,
                              priority: (["high", "medium", "low"] as const)[index % 3],
                              steps: phase.objectives,
                              resources: phase.resources,
                              completed: phase.completed,
                            }))
                          : []

                        return generatedActionItems.length === 0 ? (
                          <Card className="border-dashed">
                            <CardContent className="pt-6 text-center">
                              <p className="text-muted-foreground mb-4">No action items for this roadmap</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid gap-4">
                            {generatedActionItems.map((item) => (
                              <Card
                                key={item.id}
                                className={`hover:shadow-md transition-shadow ${item.completed ? "opacity-60" : ""}`}
                              >
                                <CardContent className="pt-6">
                                  <div className="flex items-start gap-4">
                                    <input
                                      type="checkbox"
                                      checked={item.completed || false}
                                      onChange={() => {
                                        if (selectedRoadmap) {
                                          const phaseId = item.id.split("-").pop()
                                          phaseId && handlePhaseToggle(selectedRoadmapId, phaseId, !item.completed)
                                        }
                                      }}
                                      className="w-5 h-5 rounded mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h3 className={`font-semibold text-lg ${item.completed ? "line-through" : ""}`}>
                                          {item.title}
                                        </h3>
                                        <Badge
                                          variant={
                                            item.priority === "high"
                                              ? "destructive"
                                              : item.priority === "medium"
                                                ? "default"
                                                : "secondary"
                                          }
                                        >
                                          {item.priority}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-sm font-medium mb-2">Objectives:</p>
                                          <ul className="text-sm space-y-1">
                                            {item.steps.map((step, idx) => (
                                              <li key={idx} className="text-muted-foreground">
                                                {idx + 1}. {step}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium mb-2">Resources:</p>
                                          <ul className="text-sm space-y-1">
                                            {item.resources.map((res, idx) => (
                                              <li key={idx} className="text-muted-foreground">
                                                • {res}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>

              {/* Achievements Section */}
              <div className="mt-12 pt-8 border-t border-border">
                <AchievementsBadge achievements={achievements} />
              </div>
              </TabsContent>
            </Tabs>
          </>
        )}

          {/* Add Course Modal */}
          <AddCourseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddCourse} />

          {/* Create Roadmap Modal */}
          <CreateRoadmapModal
            isOpen={isCreateRoadmapOpen}
            skill={selectedSkillForRoadmapCreation}
            onClose={() => setIsCreateRoadmapOpen(false)}
            onCreate={handleRoadmapCreation}
          />
          </div>
        </div>
      )}
    </>
  )
}

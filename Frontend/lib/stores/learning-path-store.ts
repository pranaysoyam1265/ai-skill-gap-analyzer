import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  skillName: string
  skillId: string
  resumeId: string
  category: string
  currentProficiency: string
  targetProficiency: string
  targetDate: Date
  status: "not-started" | "in-progress" | "completed"
  progress: number
  priority: "low" | "medium" | "high"
  resources: Resource[]
  notes: string
  createdAt: Date
  source: "dashboard" | "gap-analysis"
  milestones: Milestone[]
  skill?: string
  proficiency?: number
  description?: string
  timeCommitment?: string
}

interface Resource {
  id: string
  title: string
  url: string
  type: "course" | "article" | "video" | "documentation"
}

interface Milestone {
  id: string
  title: string
  completed: boolean
  dueDate?: Date
}

interface Roadmap {
  id: string
  title: string
  skill: string
  skillId: string
  status: "ready" | "active" | "completed" | "paused"
  phases: Phase[]
  startDate: string
  targetDate: string
  createdAt: Date
  source: "gap-analysis" | "dashboard"
}

interface Phase {
  id: string
  name: string
  description: string
  duration: string
  objectives: string[]
  resources: string[]
  projects: string[]
}

interface LearningPathState {
  courses: Course[]
  goals: Goal[]
  roadmaps: Roadmap[]
  addCourse: (course: Course) => void
  updateCourse: (id: string, updates: Partial<Course>) => void
  removeCourse: (id: string) => void
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void
  addRoadmap: (roadmap: Omit<Roadmap, "id" | "createdAt">) => void
  updateRoadmap: (id: string, updates: Partial<Roadmap>) => void
  removeRoadmap: (id: string) => void
  addToRoadmap: (skill: any) => void
  clearAll: () => void
  hasGoalForSkill: (skillName: string) => boolean
  hasRoadmapForSkill: (skillName: string) => boolean
  hasCourseForSkill: (skillName: string) => boolean
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      courses: [],
      goals: [],
      roadmaps: [],

      addCourse: (course) =>
        set((state) => ({
          courses: [...state.courses, course],
        })),

      updateCourse: (id, updates) =>
        set((state) => ({
          courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      removeCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
        })),

      addGoal: (goalData) => {
        const { hasGoalForSkill, addCourse, hasCourseForSkill } = get()

        // Check for duplicate goals
        if (hasGoalForSkill(goalData.skillName)) {
          console.log(`[v0] Goal already exists for skill: ${goalData.skillName}`)
          return
        }

        // Check for duplicate courses (when source is gap-analysis)
        if (goalData.source === "gap-analysis" && hasCourseForSkill(goalData.skillName)) {
          console.log(`[v0] Course already exists for skill: ${goalData.skillName}`)
          return
        }

        const newGoal: Goal = {
          ...goalData,
          id: generateId(),
          createdAt: new Date(),
          progress: 0,
          status: "not-started",
          resources: goalData.resources || [],
          milestones: goalData.milestones || [],
          notes: goalData.notes || "",
        }

        if (goalData.source === "gap-analysis") {
          const newCourse: Course = {
            id: generateId(),
            title: goalData.skillName,
            platform: "Custom",
            totalHours: 40,
            studiedHours: 0,
            progress: 0,
            status: "not-started",
            targetDate: goalData.targetDate ? new Date(goalData.targetDate).toISOString().split("T")[0] : undefined,
            notes: `Added from Gap Analysis - ${goalData.skillName}`,
            rating: undefined,
          }
          addCourse(newCourse)
        }

        set((state) => ({
          goals: [newGoal, ...state.goals].sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          }),
        }))
      },

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      addRoadmap: (roadmapData) => {
        const { hasRoadmapForSkill } = get()

        // Check for duplicates
        if (hasRoadmapForSkill(roadmapData.skill)) {
          console.log(`[v0] Roadmap already exists for skill: ${roadmapData.skill}`)
          return
        }

        const newRoadmap: Roadmap = {
          ...roadmapData,
          id: generateId(),
          createdAt: new Date(),
          status: "ready",
          phases: roadmapData.phases || [],
        }

        set((state) => ({
          roadmaps: [...state.roadmaps, newRoadmap],
        }))
      },

      updateRoadmap: (id, updates) =>
        set((state) => ({
          roadmaps: state.roadmaps.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      removeRoadmap: (id) =>
        set((state) => ({
          roadmaps: state.roadmaps.filter((r) => r.id !== id),
        })),

      addToRoadmap: (skill) => {
        const { hasRoadmapForSkill, addRoadmap } = get()

        if (hasRoadmapForSkill(skill.name)) {
          return
        }

        const phases: Phase[] = [
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

        addRoadmap({
          title: `${skill.name} Learning Roadmap`,
          skill: skill.name,
          skillId: skill.id,
          status: "ready",
          phases,
          startDate: new Date().toISOString().split("T")[0],
          targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          source: "gap-analysis",
        })
      },

      clearAll: () => set({ courses: [], goals: [], roadmaps: [] }),

      hasGoalForSkill: (skillName: string) => {
        const goals = get().goals
        return goals.some((g) => g.skillName === skillName || g.skill === skillName)
      },

      hasRoadmapForSkill: (skillName: string) => {
        const roadmaps = get().roadmaps
        return roadmaps.some((r) => r.skill === skillName)
      },

      hasCourseForSkill: (skillName: string) => {
        const courses = get().courses
        return courses.some((c) => c.title === skillName)
      },
    }),
    {
      name: "learning-path-storage",
    },
  ),
)

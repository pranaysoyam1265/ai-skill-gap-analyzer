import { create } from "zustand"
import { persist } from "zustand/middleware"

interface GapAnalysisFilters {
  selectedRole: string
  jobCategory: string
  experienceLevel: string
  targetSalary: string
  salaryCurrency: string
}

interface GapAnalysisResults {
  analyzed: boolean
  overallMatchScore: number
  criticalGaps: any[]
  skillsToImprove: any[]
  matchingSkills: any[]
}

interface GapAnalysisState {
  filters: GapAnalysisFilters
  results: GapAnalysisResults | null
  setFilters: (filters: Partial<GapAnalysisFilters>) => void
  setResults: (results: GapAnalysisResults) => void
  clearResults: () => void
  reset: () => void
  savedGoals: string[]
  savedRoadmaps: string[]
  addSavedGoal: (skillName: string) => void
  addSavedRoadmap: (skillName: string) => void
  hasGoal: (skillName: string) => boolean
  hasRoadmap: (skillName: string) => boolean
}

const initialFilters: GapAnalysisFilters = {
  selectedRole: "",
  jobCategory: "All Categories",
  experienceLevel: "All Levels",
  targetSalary: "",
  salaryCurrency: "INR",
}

export const useGapAnalysisStore = create<GapAnalysisState>()(
  persist(
    (set, get) => ({
      filters: initialFilters,
      results: null,
      savedGoals: [],
      savedRoadmaps: [],
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      setResults: (results) => set({ results }),
      clearResults: () => set({ results: null }),
      reset: () => set({ filters: initialFilters, results: null }),
      addSavedGoal: (skillName: string) =>
        set((state) => {
          if (!state.savedGoals.includes(skillName)) {
            return { savedGoals: [...state.savedGoals, skillName] }
          }
          return state
        }),
      addSavedRoadmap: (skillName: string) =>
        set((state) => {
          if (!state.savedRoadmaps.includes(skillName)) {
            return { savedRoadmaps: [...state.savedRoadmaps, skillName] }
          }
          return state
        }),
      hasGoal: (skillName: string) => get().savedGoals.includes(skillName),
      hasRoadmap: (skillName: string) => get().savedRoadmaps.includes(skillName),
    }),
    {
      name: "gap-analysis-storage",
    },
  ),
)

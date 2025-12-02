import { create } from "zustand"
import { persist } from "zustand/middleware"
import { deleteResume as deleteResumeFromSupabase } from "@/lib/services/resume-storage"
import { toast } from "sonner"

export interface Skill {
  id: string
  name: string
  category: string
  proficiency?: number
  yearsOfExperience?: number
  lastUsed?: string
  marketDemand?: number
  confidence?: number
  extractionMethod?: string
  trend?: "up" | "down" | "stable"
  recommendation?: string
  jobRoles?: string[]
  jobLevels?: string[]
}

export interface Resume {
  id: string
  filename: string
  displayName?: string
  fileSize: number
  fileType: "pdf" | "doc" | "docx" | "txt"
  uploadedAt: Date
  analyzedAt?: Date
  isActive: boolean
  status: "pending" | "processing" | "analyzed" | "error" | "failed"
  extractedSkills?: Skill[]
  storagePath?: string // NEW: Path in Supabase Storage
  candidateId?: number // NEW: Reference to FastAPI candidate ID
  metadata?: {
    originalPath?: string
    storageUrl?: string
    pageCount?: number
    extractionModel?: string
    fileCharCount?: number
  }
  error?: string
}

interface ResumeStore {
  // State
  resumes: Resume[]
  activeResumeId: string | null
  isUploading: boolean
  isAnalyzing: boolean

  // Actions
  addResume: (resume: Resume) => void
  analyzeResume: (resumeId: string, extractedSkills: Skill[]) => void
  setActiveResume: (resumeId: string) => void
  clearActiveResume: () => void
  deleteResume: (resumeId: string) => Promise<void>
  updateResume: (resumeId: string, updates: Partial<Resume>) => void
  setUploading: (isUploading: boolean) => void
  setAnalyzing: (isAnalyzing: boolean) => void

  // Getters
  getActiveResume: () => Resume | null
  getResumeById: (id: string) => Resume | null
  getAnalyzedResumes: () => Resume[]
}

const generateId = () => {
  return `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumes: [],
      activeResumeId: null,
      isUploading: false,
      isAnalyzing: false,

      addResume: (resume: Resume) => {
        set((state) => ({
          resumes: [resume, ...state.resumes],
        }))
      },

      analyzeResume: (resumeId: string, extractedSkills: Skill[]) => {
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === resumeId
              ? {
                  ...r,
                  status: "analyzed" as const,
                  analyzedAt: new Date(),
                  extractedSkills,
                  isActive: true,
                }
              : { ...r, isActive: false },
          ),
          activeResumeId: resumeId,
          isAnalyzing: false,
        }))
      },

      setActiveResume: (resumeId: string) => {
        set((state) => ({
          resumes: state.resumes.map((r) => ({
            ...r,
            isActive: r.id === resumeId,
          })),
          activeResumeId: resumeId,
        }))
      },

      clearActiveResume: () => {
        set({
          activeResumeId: null,
          resumes: [],
        })
      },

      deleteResume: async (resumeId: string) => {
        const resume = get().resumes.find(r => r.id === resumeId)
        
        if (!resume) {
          toast.error('Resume not found')
          return
        }

        // Always remove from local state first (optimistic update)
        const wasActive = resume.isActive
        set((state) => {
          const newResumes = state.resumes.filter((r) => r.id !== resumeId)
          return {
            resumes: newResumes,
            activeResumeId: wasActive ? null : state.activeResumeId,
          }
        })

        // Try to delete from Supabase (non-blocking)
        if (resume.storagePath) {
          try {
            await deleteResumeFromSupabase(resumeId, resume.storagePath)
            toast.success('Resume deleted successfully')
          } catch (error: any) {
            // Check if it's a network error
            const isNetworkError = 
              error?.message?.includes('Failed to fetch') ||
              error?.message?.includes('NetworkError') ||
              error?.name === 'TypeError'
            
            if (isNetworkError) {
              // Network error - local deletion already happened
              toast.success('Resume removed locally (Supabase unavailable)')
              console.warn('Supabase delete failed due to network error, but local deletion succeeded')
            } else {
              // Other error - show warning but don't revert local deletion
              toast.warning('Resume removed locally, but Supabase deletion failed')
              console.error('Delete error:', error)
            }
          }
        } else {
          // No storage path - just local deletion
          toast.success('Resume deleted successfully')
        }
      },

      updateResume: (resumeId: string, updates: Partial<Resume>) => {
        set((state) => ({
          resumes: state.resumes.map((r) => (r.id === resumeId ? { ...r, ...updates } : r)),
        }))
      },

      setUploading: (isUploading: boolean) => {
        set({ isUploading })
      },

      setAnalyzing: (isAnalyzing: boolean) => {
        set({ isAnalyzing })
      },

      getActiveResume: () => {
        const { resumes, activeResumeId } = get()
        return resumes.find((r) => r.id === activeResumeId) || null
      },

      getResumeById: (id: string) => {
        return get().resumes.find((r) => r.id === id) || null
      },

      getAnalyzedResumes: () => {
        return get().resumes.filter((r) => r.status === "analyzed")
      },
    }),
    {
      name: "resume-storage",
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      }),
    },
  ),
)

export { generateId }

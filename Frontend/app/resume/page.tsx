"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Upload, BookOpen, Zap, Target } from "lucide-react"
import { useResumeStore, generateId, type Resume, type Skill } from "@/lib/stores/resume-store"
import { ResumeOptionsDialog } from "@/components/resume-options-dialog"
import { ResumeList } from "@/components/resume-list"
import { toast } from "sonner"
import { initialMockSkills } from "@/lib/data/mock-skills"
import { uploadResumeToBackend, FastAPIError } from "@/lib/api/fastapi-client"
import { uploadResumeToStorage, saveResumeRecord, updateResumeWithAnalysis, getUserResumes } from "@/lib/services/resume-storage"
import { createClient } from "@/lib/supabase/client"

const RESUME_TEMPLATES = [
  { id: 1, name: "Modern", icon: "✨", color: "from-blue-500 to-cyan-500" },
  { id: 2, name: "Classic", icon: "📋", color: "from-purple-500 to-pink-500" },
  { id: 3, name: "Creative", icon: "🎨", color: "from-emerald-500 to-teal-500" },
  { id: 4, name: "Executive", icon: "👔", color: "from-amber-500 to-orange-500" },
]

export default function ResumePage() {
  const router = useRouter()
  const { addResume, analyzeResume, setUploading, setAnalyzing } = useResumeStore()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUpload, setCurrentUpload] = useState<Resume | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState("Analyzing Resume...")
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const simulateCharCount = (): number => {
    return Math.floor(Math.random() * (30000 - 15000) + 15000)
  }

  const handleFileUpload = async (file: File) => {
    const validTypes = [".pdf", ".docx", ".doc", ".txt"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(fileExtension)) {
      toast.error("Please upload a PDF, DOCX, DOC, or TXT file")
      return
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB")
      return
    }

    // Check if user is authenticated
    const supabase = createClient()
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !authUser) {
      toast.error("Please sign in to upload resumes")
      return
    }

    setIsLoading(true)
    setUploading(true)
    setUploadProgress(0)

    const USE_BACKEND = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true'

    try {
      if (USE_BACKEND) {
        // STEP 1: Upload to Supabase Storage
        toast.info("Uploading to cloud storage...")
        setUploadProgress(10)
        const { storagePath } = await uploadResumeToStorage(file, authUser)
        setUploadProgress(30)

        // STEP 2: Save initial record to database
        const resumeRecord = await saveResumeRecord({
          filename: file.name,
          file_size: file.size,
          file_type: fileExtension.replace(".", ""),
          storage_path: storagePath,
          status: 'processing',
          is_active: false,
          metadata: { originalName: file.name }
        })
        setUploadProgress(50)

        // STEP 3: Send to FastAPI for analysis
        toast.info("Analyzing resume...")
        const result = await uploadResumeToBackend(file)
        setUploadProgress(80)

        // STEP 4: Update database with analysis results
        await updateResumeWithAnalysis(
          resumeRecord.id,
          result.candidate_id,
          {
            total: result.skills.total,
            all_skills: result.skills.all_skills,
            categorized: result.skills.categorized
          }
        )
        setUploadProgress(95)

        // STEP 5: Convert backend skills to frontend format
        const backendSkills: Skill[] = result.skills.all_skills.map((name, index) => ({
          id: `skill_${Date.now()}_${index}`,
          name,
          category: result.skills.categorized 
            ? Object.entries(result.skills.categorized).find(([_, skills]) => skills.includes(name))?.[0] || "Extracted"
            : "Extracted",
          proficiency: 80,
          confidence: 0.9,
          extractionMethod: result.skills.extraction_methods || "Backend NER",
          marketDemand: 75,
          trend: "stable" as const,
          recommendation: "Backend Extracted",
          jobRoles: [],
          jobLevels: [],
        }))

        // STEP 6: Update local state (Zustand)
        const newResume: Resume = {
          id: resumeRecord.id, // Use Supabase ID
          filename: file.name,
          fileSize: file.size,
          fileType: fileExtension.replace(".", "") as "pdf" | "doc" | "docx" | "txt",
          uploadedAt: new Date(resumeRecord.uploaded_at),
          isActive: false,
          status: "analyzed",
          extractedSkills: backendSkills,
          storagePath: storagePath,
          candidateId: result.candidate_id,
          metadata: {
            fileCharCount: simulateCharCount(),
          },
        }

        addResume(newResume)
        setCurrentUpload(newResume)
        setUploadProgress(100)
        
        toast.success(`✅ Resume uploaded! Found ${result.skills.total} skills`)
        setShowOptionsDialog(true)
        
      } else {
        // MOCK DATA (keep existing code)
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval)
              return prev
            }
            return prev + Math.random() * 30
          })
        }, 200)

        setTimeout(() => {
          setUploadProgress(100)
          setIsLoading(false)
          setUploading(false)
          clearInterval(interval)

          const newResume: Resume = {
            id: generateId(),
            filename: file.name,
            fileSize: file.size,
            fileType: fileExtension.replace(".", "") as "pdf" | "doc" | "docx" | "txt",
            uploadedAt: new Date(),
            isActive: false,
            status: "pending",
            metadata: {
              fileCharCount: simulateCharCount(),
            },
          }

          addResume(newResume)
          setCurrentUpload(newResume)

          setShowOptionsDialog(true)
          toast.success("Resume uploaded successfully")
        }, 2000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      if (error instanceof FastAPIError) {
        toast.error(`Backend Error: ${error.message}`)
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to upload resume. Please try again.")
      }
    } finally {
      setIsLoading(false)
      setUploading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleExtractSkillsFromDialog = () => {
    setShowOptionsDialog(false)
    if (!currentUpload) return

    const USE_BACKEND = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true'

    // If backend was used, skills are already extracted
    if (USE_BACKEND && currentUpload.extractedSkills && currentUpload.extractedSkills.length > 0) {
      analyzeResume(currentUpload.id, currentUpload.extractedSkills)
      setCurrentUpload(null)
      router.push("/dashboard")
      return
    }

    // Otherwise, use mock processing
    setIsProcessing(true)
    setAnalyzing(true)

    const timings = [
      { delay: 0, text: "Analyzing Resume..." },
      { delay: 1000, text: "Identifying Skills..." },
      { delay: 2000, text: "Almost Done..." },
    ]

    timings.forEach((timing) => {
      setTimeout(() => {
        setProcessingText(timing.text)
      }, timing.delay)
    })

    setTimeout(() => {
      analyzeResume(currentUpload.id, initialMockSkills)
      setIsProcessing(false)
      setAnalyzing(false)
      setCurrentUpload(null)
      router.push("/dashboard")
    }, 2500)
  }

  const handleUploadAnother = () => {
    setShowOptionsDialog(false)
    setCurrentUpload(null)
    setUploadProgress(0)
  }

  // Load resumes from Supabase on mount
  useEffect(() => {
    const loadResumes = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      try {
        const resumes = await getUserResumes()
        
        // Convert Supabase records to frontend format
        const formattedResumes: Resume[] = resumes.map(r => ({
          id: r.id,
          filename: r.filename,
          fileSize: r.file_size,
          fileType: r.file_type as "pdf" | "doc" | "docx" | "txt",
          uploadedAt: new Date(r.uploaded_at),
          analyzedAt: r.analyzed_at ? new Date(r.analyzed_at) : undefined,
          isActive: r.is_active,
          status: r.status as "pending" | "processing" | "analyzed" | "error" | "failed",
          extractedSkills: r.extracted_skills?.all_skills?.map((name: string, index: number) => ({
            id: `skill_${index}`,
            name,
            category: r.extracted_skills?.categorized 
              ? Object.entries(r.extracted_skills.categorized).find(([_, skills]: [string, string[]]) => skills.includes(name))?.[0] || "Extracted"
              : "Extracted",
            proficiency: 80,
            confidence: 0.9,
            extractionMethod: "Backend NER",
            marketDemand: 75,
            trend: "stable" as const,
            recommendation: "Backend Extracted",
            jobRoles: [],
            jobLevels: [],
          })) || [],
          storagePath: r.storage_path,
          candidateId: r.candidate_id,
          metadata: r.metadata || {},
        }))

        // Load into Zustand store (avoid duplicates by checking existing)
        const { resumes: existingResumes } = useResumeStore.getState()
        formattedResumes.forEach(resume => {
          const existing = existingResumes.find(r => r.id === resume.id)
          if (!existing) {
            addResume(resume)
          }
        })
      } catch (error) {
        console.error('Failed to load resumes:', error)
      }
    }

    loadResumes()
  }, [addResume])

  useEffect(() => {
    if (!isProcessing) return

    const timings = [
      { delay: 0, text: "Analyzing Resume..." },
      { delay: 1000, text: "Identifying Skills..." },
      { delay: 2000, text: "Almost Done..." },
    ]

    const timeouts = timings.map((timing) =>
      setTimeout(() => {
        setProcessingText(timing.text)
      }, timing.delay),
    )

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [isProcessing])

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 mx-0">
      <ResumeOptionsDialog
        open={showOptionsDialog}
        onExtractSkills={handleExtractSkillsFromDialog}
        onUploadAnother={handleUploadAnother}
        resumeName={currentUpload?.filename || ""}
      />

      <Dialog open={isProcessing} onOpenChange={setIsProcessing}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <Spinner className="size-12 text-blue-500" />
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Analyzing Resume</h2>
              <p className="text-sm text-foreground/70">{processingText}</p>
              <p className="text-xs text-foreground/50">
                Our AI is extracting your skills and experience. This will take just a moment...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 md:mb-3">
            Upload Your Resume
          </h1>
          <p className="text-base md:text-lg text-foreground/70">Let's extract your skills and analyze your profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ResumeList />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`glass p-6 md:p-12 rounded-lg border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragActive
                  ? "border-blue-500 bg-blue-500/10 scale-105"
                  : "border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5"
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">Choose Your Resume</h2>
                  <p className="text-sm md:text-base text-foreground/70">Drag and drop or click to select</p>
                  <p className="text-xs md:text-sm text-foreground/50">PDF, DOC, DOCX, or TXT (up to 5MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="resume-upload"
                  disabled={isLoading}
                />
                <label htmlFor="resume-upload" className="w-full">
                  <Button asChild disabled={isLoading} size="lg" className="w-full">
                    <span>{isLoading ? "Processing..." : "Select File"}</span>
                  </Button>
                </label>

                {isLoading && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-2">
                      <Spinner className="size-4 text-blue-500" />
                      <span className="text-sm text-foreground/70">Processing... {Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-foreground">AI Processing Preview</h3>
              </div>
              <p className="text-sm text-foreground/70 mb-4">
                Our AI will analyze your resume to extract skills, experience, and identify gaps in your profile.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-foreground/60">Extracting skills and competencies</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="text-sm text-foreground/60">Analyzing experience level</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  />
                  <span className="text-sm text-foreground/60">Identifying skill gaps</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="glass p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-foreground">Tips for Best Results</h3>
              </div>
              <ul className="space-y-3 text-sm text-foreground/70">
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use a clear, well-formatted resume</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Include all relevant skills and experience</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Ensure file is under 5MB</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use standard fonts for better parsing</span>
                </li>
              </ul>
            </div>

            <div className="glass p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-foreground">Resume Templates</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {RESUME_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`glass p-4 rounded-lg text-center cursor-pointer hover:scale-105 transition-transform duration-300 border border-white/10 hover:border-white/30`}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <p className="text-xs font-medium text-foreground">{template.name}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 text-foreground/70 bg-transparent">
                Browse Templates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useResumeStore, type Resume } from "@/lib/stores/resume-store"
import { useSkillsStore } from "@/lib/stores/skills-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Sparkles, Star, Trash2, FileText, HardDrive, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { initialMockSkills } from "@/lib/data/mock-skills"

export function ResumeList() {
  const router = useRouter()
  const { resumes, setActiveResume, deleteResume, analyzeResume, setAnalyzing } = useResumeStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState("Analyzing Resume...")

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleExtractSkills = async (resume: Resume) => {
    setIsProcessing(true)
    setAnalyzing(true)

    // Simulate AI processing with progressive text updates
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

    // Simulate skill extraction (replace with actual API call)
    setTimeout(() => {
      analyzeResume(resume.id, initialMockSkills)
      setIsProcessing(false)
      setAnalyzing(false)
      toast.success(`Skills extracted from ${resume.filename}`)
      router.push("/dashboard")
    }, 2500)
  }

  const handleSetActive = (resume: Resume) => {
    setActiveResume(resume.id)
    toast.success(`Switched to ${resume.filename}`)
  }

  const handleDeleteClick = (resume: Resume) => {
    setResumeToDelete(resume)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (resumeToDelete) {
      const wasActive = resumeToDelete.isActive
      
      try {
        await deleteResume(resumeToDelete.id)

        if (wasActive) {
          useSkillsStore.getState().clearSkills()
        }

        setDeleteDialogOpen(false)
        setResumeToDelete(null)
      } catch (error) {
        // Error is already handled in the store with toast
        console.error('Delete failed:', error)
      }
    }
  }

  if (resumes.length === 0) {
    return null
  }

  return (
    <>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{resumeToDelete?.filename}</strong>? This action cannot be undone.
              {resumeToDelete?.isActive && (
                <span className="block mt-2 text-destructive font-medium">
                  This is your currently active resume. Dashboard data will be cleared.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">Your Resumes</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className={`p-4 ${resume.isActive ? "border-2 border-blue-500" : ""}`}>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{resume.filename}</h4>
                      </div>
                    </div>
                    {resume.isActive && (
                      <Badge className="bg-blue-500 text-white flex-shrink-0">
                        <Star className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(resume.fileSize)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(resume.uploadedAt)}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {resume.status === "pending" && <Badge variant="secondary">Not Analyzed</Badge>}
                    {resume.status === "analyzed" && resume.analyzedAt && (
                      <Badge variant="default" className="bg-emerald-500">
                        Analyzed on {formatDate(resume.analyzedAt)}
                      </Badge>
                    )}
                    {resume.status === "error" && <Badge variant="destructive">Error</Badge>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {resume.status === "pending" && (
                      <Button size="sm" onClick={() => handleExtractSkills(resume)} className="flex-1">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Extract Skills
                      </Button>
                    )}
                    {resume.status === "analyzed" && !resume.isActive && (
                      <Button size="sm" variant="secondary" onClick={() => handleSetActive(resume)} className="flex-1">
                        <Star className="w-4 h-4 mr-1" />
                        Set as Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(resume)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

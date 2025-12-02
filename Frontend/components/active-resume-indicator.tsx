"use client"

import { FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useResumeStore } from "@/lib/stores/resume-store"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function ActiveResumeIndicator() {
  const { resumes, activeResumeId, setActiveResume } = useResumeStore()
  const router = useRouter()
  const { toast } = useToast()

  const activeResume = resumes.find((r) => r.id === activeResumeId)
  const analyzedResumes = resumes.filter((r) => r.status === "analyzed")

  if (!activeResume) {
    return (
      <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">No resume analyzed yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload and analyze a resume to see skills here</p>
          </div>
          <Button size="sm" onClick={() => router.push("/resume")}>
            Go to Resume Upload
          </Button>
        </div>
      </div>
    )
  }

  const handleResumeSwitch = (resumeId: string) => {
    setActiveResume(resumeId)
    const newActiveResume = resumes.find((r) => r.id === resumeId)
    if (newActiveResume) {
      toast({
        title: "Resume switched",
        description: `Now viewing ${newActiveResume.filename}`,
      })
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-lg text-muted-foreground">
        <FileText className="w-5 h-5" />
        <span>Analyzed for:</span>
        {analyzedResumes.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-0 font-bold text-lg text-foreground hover:bg-transparent">
                {activeResume.filename}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Select Active Resume</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {analyzedResumes.map((resume) => (
                <DropdownMenuItem
                  key={resume.id}
                  onClick={() => handleResumeSwitch(resume.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{resume.filename}</span>
                  {resume.id === activeResumeId && (
                    <span className="text-xs text-primary font-medium ml-2">✓ Active</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/resume")} className="cursor-pointer">
                Upload New Resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="font-bold text-foreground">{activeResume.filename}</span>
        )}
      </div>
    </div>
  )
}

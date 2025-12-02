"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Upload, CheckCircle2 } from "lucide-react"

interface ResumeOptionsDialogProps {
  open: boolean
  onExtractSkills: () => void
  onUploadAnother: () => void
  resumeName: string
}

export function ResumeOptionsDialog({ open, onExtractSkills, onUploadAnother, resumeName }: ResumeOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <DialogTitle className="text-2xl">Resume Uploaded Successfully</DialogTitle>
          <DialogDescription className="text-base">What would you like to do next?</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          {/* Option 1: Extract Skills */}
          <Button onClick={onExtractSkills} size="lg-flexible" className="w-full flex items-center justify-start gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col items-start gap-0">
              <span className="font-semibold text-sm">Extract Skills for This Resume</span>
              <span className="text-xs opacity-90 font-normal">Analyze this resume and view extracted skills</span>
            </div>
          </Button>

          {/* Option 2: Upload Another */}
          <Button
            onClick={onUploadAnother}
            variant="outline"
            size="lg-flexible"
            className="w-full flex items-center justify-start gap-3 bg-transparent"
          >
            <Upload className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col items-start gap-0">
              <span className="font-semibold text-sm">Upload Another Resume</span>
              <span className="text-xs opacity-70 font-normal">Add another resume to your collection</span>
            </div>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Uploaded: <span className="font-medium">{resumeName}</span>
        </p>
      </DialogContent>
    </Dialog>
  )
}

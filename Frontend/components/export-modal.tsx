"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, FileJson, FileText, FileSpreadsheet } from "lucide-react"
import { downloadCSV, downloadJSON, downloadPDF, type SkillData } from "@/lib/export-utils"

interface ExportModalProps {
  skills: SkillData[]
  trigger?: React.ReactNode
}

export function ExportModal({ skills, trigger }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (format: "csv" | "json" | "pdf") => {
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `skills-analysis-${timestamp}`

    switch (format) {
      case "csv":
        downloadCSV(skills, `${filename}.csv`)
        break
      case "json":
        downloadJSON(skills, `${filename}.json`)
        break
      case "pdf":
        downloadPDF(skills, `${filename}.pdf`)
        break
    }

    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Your Skills Analysis</DialogTitle>
          <DialogDescription>Choose a format to download your skills report</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            onClick={() => handleExport("csv")}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <FileSpreadsheet className="w-5 h-5 text-green-500" />
            <div className="text-left">
              <div className="font-semibold">CSV Format</div>
              <div className="text-xs text-muted-foreground">Import to Excel or Google Sheets</div>
            </div>
          </Button>
          <Button
            onClick={() => handleExport("json")}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <FileJson className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <div className="font-semibold">JSON Format</div>
              <div className="text-xs text-muted-foreground">For developers and integrations</div>
            </div>
          </Button>
          <Button
            onClick={() => handleExport("pdf")}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <FileText className="w-5 h-5 text-red-500" />
            <div className="text-left">
              <div className="font-semibold">PDF Report</div>
              <div className="text-xs text-muted-foreground">Professional formatted report</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

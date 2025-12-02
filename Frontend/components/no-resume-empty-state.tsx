"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, ArrowRight } from "lucide-react"
import Link from "next/link"

export function NoResumeEmptyState() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto min-h-screen flex items-center justify-center">
      <Card className="glass p-8 md:p-12 space-y-6 w-full text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Upload className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">No Active Resume</h2>
          <p className="text-foreground/70 text-lg">
            Upload and analyze a resume to see detailed analytics and insights about your skills.
          </p>
        </div>

        {/* Description */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-foreground/80">
            <strong>Get started:</strong> Upload your resume to extract your skills and get a detailed gap analysis for
            your target role.
          </p>
          <ul className="text-sm text-foreground/70 space-y-1 text-left">
            <li>✓ Extract and analyze your current skills</li>
            <li>✓ Compare against target roles</li>
            <li>✓ Identify critical skill gaps</li>
            <li>✓ Create personalized learning paths</li>
          </ul>
        </div>

        {/* CTA Button */}
        <div className="flex gap-3 flex-col sm:flex-row justify-center pt-2">
          <Link href="/resume" className="flex-1 sm:flex-none">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-auto whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </Button>
          </Link>
          <Link href="/learning-path" className="flex-1 sm:flex-none">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 bg-transparent border-white/10 hover:bg-white/5 px-8 py-3 h-auto whitespace-nowrap"
            >
              Explore Learning Paths
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, TrendingUp, BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"

interface GapAnalysisEmptyStateProps {
  onGetStarted?: () => void
}

export function GapAnalysisEmptyState({ onGetStarted }: GapAnalysisEmptyStateProps) {
  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground text-balance">Discover Your Skill Gaps</h1>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
          Get personalized insights on the skills you need to master your target role. Start by selecting a role and
          analyzing your current skill set.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass p-6 space-y-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-semibold text-foreground">50+ Target Roles</h3>
          <p className="text-sm text-foreground/70">Choose from various career paths across tech</p>
        </Card>
        <Card className="glass p-6 space-y-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-foreground">Smart Analysis</h3>
          <p className="text-sm text-foreground/70">AI-powered gap analysis based on market data</p>
        </Card>
        <Card className="glass p-6 space-y-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-foreground">Learning Paths</h3>
          <p className="text-sm text-foreground/70">Personalized courses and resources for growth</p>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="glass p-8 space-y-6">
        <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
              1
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Select Your Target Role</h3>
              <p className="text-sm text-foreground/70 mt-1">
                Choose the career role you aspire to. We have 50+ roles from Frontend Developer to Solutions Architect.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
              2
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Configure Your Parameters</h3>
              <p className="text-sm text-foreground/70 mt-1">
                Set your experience level, target salary, and job category for a more accurate analysis.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">
              3
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Get Your Analysis</h3>
              <p className="text-sm text-foreground/70 mt-1">
                Receive detailed insights on critical gaps, skills to improve, and your matching strengths.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
              4
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Create Your Learning Path</h3>
              <p className="text-sm text-foreground/70 mt-1">
                Convert gaps into actionable learning goals with curated courses and timelines.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button size="lg" onClick={onGetStarted} className="gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          Start Gap Analysis
        </Button>
        <Link href="/learning-path">
          <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 bg-transparent">
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            Explore Learning Paths
          </Button>
        </Link>
      </div>

      {/* Tips Section */}
      <Card className="glass p-6 space-y-4 bg-amber-500/5 border-amber-500/20">
        <h3 className="font-semibold text-foreground">Pro Tips for Better Results</h3>
        <ul className="space-y-2 text-sm text-foreground/80">
          <li className="flex gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            <span>Be specific with your target role - more specific roles give more accurate recommendations</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            <span>Set realistic salary targets based on your experience level for meaningful insights</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            <span>Review your analysis regularly as market demands and technologies evolve</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            <span>Focus on high-priority gaps first before moving to skills to improve</span>
          </li>
        </ul>
      </Card>

      {/* Featured Roles */}
      <Card className="glass p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Popular Roles to Explore</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "Backend Developer",
            "Frontend Developer",
            "DevOps Engineer",
            "Data Scientist",
            "Full Stack Developer",
            "Cloud Engineer (AWS)",
            "ML Engineer",
            "System Architect",
          ].map((role) => (
            <Button key={role} variant="outline" size="sm" className="text-xs bg-transparent" title={role}>
              {role}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}

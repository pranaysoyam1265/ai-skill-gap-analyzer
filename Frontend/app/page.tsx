import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Nebula Powered</span>
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-6xl font-bold text-foreground text-balance bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            AI Skill Gap Analyzer Pro
          </h1>
          <p className="text-xl text-foreground/70 text-balance max-w-2xl mx-auto">
            Analyze your resume, identify skill gaps, and create personalized learning paths powered by advanced AI
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/resume">
            <Button size="lg" className="btn-primary-glow gap-2 w-full sm:w-auto">
              Extract Skills
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white/20 hover:bg-white/5 bg-transparent"
            >
              View Dashboard
            </Button>
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {[
            {
              title: "Resume Analysis",
              description: "Upload your resume and let AI extract your skills with precision",
              icon: "📄",
            },
            {
              title: "Skill Dashboard",
              description: "Visualize your skills and proficiency levels in real-time",
              icon: "📊",
            },
            {
              title: "Learning Paths",
              description: "Get personalized recommendations to close your skill gaps",
              icon: "🎯",
            },
          ].map((feature) => (
            <div key={feature.title} className="luminous-card group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground text-lg">{feature.title}</h3>
              <p className="text-sm text-foreground/70">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 pt-8">
          {[
            { label: "Skills Analyzed", value: "1000+" },
            { label: "Learning Paths", value: "500+" },
            { label: "Success Rate", value: "98%" },
          ].map((stat) => (
            <div key={stat.label} className="glass p-4">
              <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
              <div className="text-xs text-foreground/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

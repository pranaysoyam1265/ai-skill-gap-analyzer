"use client"

import type React from "react"

import { Github, Linkedin, Globe, Twitter, Code, BookOpen, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProfessionalLink {
  platform: string
  url: string
}

interface ProfessionalLinksDisplayProps {
  links: ProfessionalLink[]
}

const PLATFORM_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  github: { icon: <Github className="w-4 h-4" />, label: "GitHub", color: "bg-gray-600" },
  linkedin: { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn", color: "bg-blue-600" },
  portfolio: { icon: <Globe className="w-4 h-4" />, label: "Portfolio", color: "bg-purple-600" },
  twitter: { icon: <Twitter className="w-4 h-4" />, label: "Twitter", color: "bg-blue-400" },
  stackoverflow: { icon: <Code className="w-4 h-4" />, label: "Stack Overflow", color: "bg-orange-500" },
  blog: { icon: <BookOpen className="w-4 h-4" />, label: "Blog", color: "bg-amber-600" },
}

export function ProfessionalLinksDisplay({ links }: ProfessionalLinksDisplayProps) {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const config = PLATFORM_CONFIG[link.platform]
        if (!config) return null

        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
            title={config.label}
          >
            <Badge className={`${config.color} text-white hover:opacity-80 gap-1 cursor-pointer transition-opacity`}>
              {config.icon}
              <span>{config.label}</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </Badge>
          </a>
        )
      })}
    </div>
  )
}

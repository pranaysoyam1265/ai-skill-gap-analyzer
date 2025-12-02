"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SkillExtractorProps {
  skills: Array<{
    id: string
    name: string
    category: string
    proficiency: number
  }>
}

export function SkillExtractor({ skills }: SkillExtractorProps) {
  return (
    <div className="space-y-4">
      {skills.map((skill) => (
        <Card key={skill.id} className="glass p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <h3 className="font-semibold text-foreground">{skill.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {skill.category}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground/70">Proficiency</p>
            <p className="text-2xl font-bold text-primary">{skill.proficiency}%</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

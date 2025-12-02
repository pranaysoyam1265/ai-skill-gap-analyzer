"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"

interface SkillsListProps {
  skills: Array<{
    id: string
    name: string
    category: string
    proficiency: number
    level: string
  }>
}

export function SkillsList({ skills }: SkillsListProps) {
  // Group skills by category
  const groupedSkills = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, typeof skills>,
  )

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "bg-primary/20 text-primary"
      case "Advanced":
        return "bg-accent/20 text-accent"
      case "Intermediate":
        return "bg-secondary/20 text-secondary"
      default:
        return "bg-muted/20 text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">{category}</h3>
          <div className="space-y-2">
            {categorySkills.map((skill) => (
              <Card key={skill.id} className="glass p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{skill.name}</h4>
                      <Badge className={getLevelColor(skill.level)}>{skill.level}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${skill.proficiency}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{skill.proficiency}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

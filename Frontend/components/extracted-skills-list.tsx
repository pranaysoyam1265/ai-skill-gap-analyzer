"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface ExtractedSkillsListProps {
  skills: Array<{
    id: string
    name: string
    category: string
    proficiency: number
    confirmed: boolean
  }>
  onConfirm: (id: string) => void
  onRemove: (id: string) => void
}

export function ExtractedSkillsList({ skills, onConfirm, onRemove }: ExtractedSkillsListProps) {
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

  return (
    <div className="space-y-6">
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">{category}</h3>
          <div className="space-y-2">
            {categorySkills.map((skill) => (
              <Card
                key={skill.id}
                className={`glass p-4 flex items-center justify-between transition-all ${
                  skill.confirmed ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{skill.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${skill.proficiency}%` }} />
                      </div>
                      <span className="text-xs text-foreground/70">{skill.proficiency}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant={skill.confirmed ? "default" : "outline"}
                    onClick={() => onConfirm(skill.id)}
                    className="gap-1"
                  >
                    <Check className="w-4 h-4" />
                    {skill.confirmed ? "Confirmed" : "Confirm"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(skill.id)}>
                    <X className="w-4 h-4" />
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

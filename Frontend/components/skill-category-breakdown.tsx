"use client"

import { Card } from "@/components/ui/card"

interface SkillCategoryBreakdownProps {
  categories: Array<{
    name: string
    count: number
    avgProficiency: number
  }>
}

export function SkillCategoryBreakdown({ categories }: SkillCategoryBreakdownProps) {
  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <Card key={category.name} className="glass p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground">{category.name}</h4>
            <span className="text-sm text-foreground/70">{category.count} skills</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${category.avgProficiency}%` }} />
            </div>
            <span className="text-sm font-medium text-foreground">{category.avgProficiency}%</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

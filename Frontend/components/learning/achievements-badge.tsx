"use client"

import { Trophy, Star, Zap, Target, BookOpen, Flame } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Achievement {
  id: string
  title: string
  description: string
  icon: "trophy" | "star" | "zap" | "target" | "book" | "flame"
  unlocked: boolean
  unlockedDate?: string
}

interface AchievementsBadgeProps {
  achievements: Achievement[]
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  book: BookOpen,
  flame: Flame,
}

export function AchievementsBadge({ achievements }: AchievementsBadgeProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <Badge variant="secondary">
          {unlockedCount} / {achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {achievements.map((achievement) => {
          const Icon = iconMap[achievement.icon]
          return (
            <Card
              key={achievement.id}
              className={`text-center transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
                  : "opacity-50 grayscale"
              }`}
            >
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                <div
                  className={`p-3 rounded-full ${
                    achievement.unlocked ? "bg-yellow-500/20 text-yellow-600" : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold line-clamp-2">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                </div>
                {achievement.unlocked && achievement.unlockedDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

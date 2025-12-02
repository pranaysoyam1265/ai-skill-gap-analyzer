import type React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Zap, Target } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first course",
    icon: <Trophy className="w-6 h-6" />,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "2",
    title: "Quick Learner",
    description: "Complete 3 courses",
    icon: <Zap className="w-6 h-6" />,
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "3",
    title: "Perfectionist",
    description: "Complete a course with 5-star rating",
    icon: <Star className="w-6 h-6" />,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "4",
    title: "Goal Setter",
    description: "Set a target date for 5 courses",
    icon: <Target className="w-6 h-6" />,
    color: "bg-blue-100 text-blue-800",
  },
]

export function AchievementsCarousel() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Achievements</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className="flex-shrink-0 w-64 p-6 space-y-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.color}`}>
              {achievement.icon}
            </div>
            <div>
              <h3 className="font-semibold">{achievement.title}</h3>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </div>
            <Badge variant="outline">Locked</Badge>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface Course {
  id: string
  status: "not-started" | "in-progress" | "completed" | "paused" | "dropped"
  studiedHours: number
  totalHours: number
  rating?: number
}

interface Goal {
  id: string
  status: "active" | "completed" | "paused"
  proficiency?: number
}

interface Roadmap {
  id: string
  status: "active" | "completed" | "paused" | "ready"
  phases: { id: string; completed: boolean }[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: "trophy" | "star" | "zap" | "target" | "book" | "flame"
  unlocked: boolean
  unlockedDate?: string
}

export function calculateAchievements(courses: Course[], goals: Goal[], roadmaps: Roadmap[]): Achievement[] {
  const completedCourses = courses.filter((c) => c.status === "completed").length
  const completedGoals = goals.filter((g) => g.status === "completed").length
  const completedRoadmaps = roadmaps.filter((r) => r.status === "completed").length
  const totalStudiedHours = courses.reduce((sum, c) => sum + c.studiedHours, 0)
  const fiveStarCourses = courses.filter((c) => c.rating === 5).length
  const masteryCourses = courses.filter((c) => c.proficiency >= 90).length
  const completedPhases = roadmaps.reduce((sum, r) => sum + r.phases.filter((p) => p.completed).length, 0)

  const achievements: Achievement[] = [
    {
      id: "a1",
      title: "First Course",
      description: "Complete your first course",
      icon: "book",
      unlocked: completedCourses >= 1,
      unlockedDate: completedCourses >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: "a2",
      title: "Goal Setter",
      description: "Create your first learning goal",
      icon: "target",
      unlocked: goals.length >= 1,
      unlockedDate: goals.length >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: "a3",
      title: "Roadmap Builder",
      description: "Create your first roadmap",
      icon: "zap",
      unlocked: roadmaps.length >= 1,
      unlockedDate: roadmaps.length >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: "a4",
      title: "5 Courses",
      description: "Complete 5 courses",
      icon: "trophy",
      unlocked: completedCourses >= 5,
      unlockedDate: completedCourses >= 5 ? new Date().toISOString() : undefined,
    },
    {
      id: "a5",
      title: "100 Hours",
      description: "Study for 100 hours",
      icon: "flame",
      unlocked: totalStudiedHours >= 100,
      unlockedDate: totalStudiedHours >= 100 ? new Date().toISOString() : undefined,
    },
    {
      id: "a6",
      title: "Mastery",
      description: "Reach 90% proficiency in a skill",
      icon: "star",
      unlocked: masteryCourses >= 1,
      unlockedDate: masteryCourses >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: "a7",
      title: "Perfect Score",
      description: "Rate a course 5 stars",
      icon: "star",
      unlocked: fiveStarCourses >= 1,
      unlockedDate: fiveStarCourses >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: "a8",
      title: "Goal Master",
      description: "Complete 3 goals",
      icon: "target",
      unlocked: completedGoals >= 3,
      unlockedDate: completedGoals >= 3 ? new Date().toISOString() : undefined,
    },
    {
      id: "a9",
      title: "Roadmap Rockstar",
      description: "Complete a full roadmap",
      icon: "zap",
      unlocked: completedRoadmaps >= 1,
      unlockedDate: completedRoadmaps >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: "a10",
      title: "Phase Conqueror",
      description: "Complete 5 roadmap phases",
      icon: "trophy",
      unlocked: completedPhases >= 5,
      unlockedDate: completedPhases >= 5 ? new Date().toISOString() : undefined,
    },
  ]

  return achievements
}

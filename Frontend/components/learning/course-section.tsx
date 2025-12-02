"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { EnhancedCourseCard } from "./enhanced-course-card"
import { CompletedCourseCard } from "./completed-course-card"

interface Course {
  id: string
  title: string
  platform: string
  totalHours: number
  studiedHours: number
  progress: number
  status: "not-started" | "in-progress" | "completed" | "paused" | "dropped"
  targetDate?: string
  notes?: string
  rating?: number
}

interface CourseSectionProps {
  status: "in-progress" | "not-started" | "completed" | "paused"
  courses: Course[]
  onUpdate: (id: string, updates: Partial<Course>) => void
  onRemove: (id: string) => void
  onStatusChange: (id: string, status: Course["status"]) => void
}

const sectionConfig = {
  "in-progress": {
    label: "In Progress",
    bgLight: "bg-blue-50 dark:bg-blue-950",
    bgHover: "hover:bg-blue-100 dark:hover:bg-blue-900",
    borderColor: "border-blue-500",
    textColor: "text-blue-900 dark:text-blue-100",
    gradientFrom: "from-blue-500/20",
    gradientTo: "to-blue-600/20",
  },
  "not-started": {
    label: "Not Started",
    bgLight: "bg-gray-50 dark:bg-gray-900",
    bgHover: "hover:bg-gray-100 dark:hover:bg-gray-800",
    borderColor: "border-gray-500",
    textColor: "text-gray-900 dark:text-gray-100",
    gradientFrom: "from-gray-500/20",
    gradientTo: "to-gray-600/20",
  },
  completed: {
    label: "Completed",
    bgLight: "bg-green-50 dark:bg-green-950",
    bgHover: "hover:bg-green-100 dark:hover:bg-green-900",
    borderColor: "border-green-500",
    textColor: "text-green-900 dark:text-green-100",
    gradientFrom: "from-green-500/20",
    gradientTo: "to-green-600/20",
  },
  paused: {
    label: "Paused",
    bgLight: "bg-yellow-50 dark:bg-yellow-950",
    bgHover: "hover:bg-yellow-100 dark:hover:bg-yellow-900",
    borderColor: "border-yellow-500",
    textColor: "text-yellow-900 dark:text-yellow-100",
    gradientFrom: "from-yellow-500/20",
    gradientTo: "to-yellow-600/20",
  },
}

export function CourseSection({ status, courses, onUpdate, onRemove, onStatusChange }: CourseSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const config = sectionConfig[status]

  if (courses.length === 0) return null

  return (
    <div className="border rounded-lg overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 ${config.bgLight} ${config.bgHover} flex items-center justify-between font-semibold ${config.textColor} transition-all duration-300 border-l-4 ${config.borderColor} group`}
      >
        <div className="flex items-center gap-3">
          <span>{config.label}</span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-current/10 text-sm font-bold">
            {courses.length}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && (
        <div className="space-y-3 p-4 bg-gradient-to-b dark:from-background/50 dark:to-background/30 from-background to-background/50 animate-in fade-in duration-300">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {course.status === "completed" ? (
                <CompletedCourseCard
                  course={course}
                  onUpdate={(updates) => onUpdate(course.id, updates)}
                  onRemove={() => onRemove(course.id)}
                  onStatusChange={(newStatus) => onStatusChange(course.id, newStatus)}
                />
              ) : (
                <EnhancedCourseCard
                  course={course}
                  onUpdate={(updates) => onUpdate(course.id, updates)}
                  onRemove={() => onRemove(course.id)}
                  onStatusChange={(newStatus) => onStatusChange(course.id, newStatus)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

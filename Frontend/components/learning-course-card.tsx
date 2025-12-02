"use client"

import { useState } from "react"
import { ChevronDown, Clock, GripVertical, MoreVertical, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StudyTimer } from "./learning/study-timer"

interface Course {
  id: string
  title: string
  platform: string
  progress: number
  status: "not-started" | "in-progress" | "completed" | "paused" | "dropped"
  targetDate: string
  notes: string
  rating?: number
  totalHours: number
  studiedHours: number
}

interface LearningCourseCardProps {
  course: Course
  onUpdate: (updates: Partial<Course>) => void
  onRemove: () => void
}

const statusColors = {
  "not-started": "bg-gray-500",
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  paused: "bg-yellow-500",
  dropped: "bg-red-500",
}

const statusLabels = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
}

export function LearningCourseCard({ course, onUpdate, onRemove }: LearningCourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState(course.notes)
  const [rating, setRating] = useState(course.rating || 0)

  const handleProgressChange = (value: number[]) => {
    onUpdate({ progress: value[0] })
  }

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    onUpdate({ notes: newNotes })
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    onUpdate({ rating: newRating })
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="pt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-4">
            {/* Left Section - Title & Badges */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <Badge variant="outline">{course.platform}</Badge>
                <Badge className={statusColors[course.status]}>{statusLabels[course.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Target completion: {new Date(course.targetDate).toLocaleDateString()}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdate({ status: "completed" })}>Mark as Complete</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ status: "paused" })}>Pause Course</DropdownMenuItem>
                <DropdownMenuItem onClick={onRemove} className="text-red-500">
                  Remove from Path
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{course.progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* Progress Slider */}
          <div className="mb-4">
            <Slider
              value={[course.progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Study Hours */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {course.studiedHours}h / {course.totalHours}h studied
              </span>
            </div>
          </div>

          {/* Study Timer */}
          <div className="mb-4">
            <StudyTimer courseId={course.id} onUpdate={onUpdate} />
          </div>

          {/* Expandable Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 mb-4"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            {isExpanded ? "Hide Details" : "Show Details"}
          </button>

          {/* Expandable Content Section */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Notes */}
              <div>
                <label className="text-sm font-medium block mb-2">Personal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add your notes about this course..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Rating */}
              {course.status === "completed" && (
                <div>
                  <label className="text-sm font-medium block mb-2">Course Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => handleRatingChange(star)} className="transition-colors">
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

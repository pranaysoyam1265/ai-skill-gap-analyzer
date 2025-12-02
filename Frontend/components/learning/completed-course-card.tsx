"use client"
import { CheckCircle2, Trash2, RotateCcw, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

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

interface CompletedCourseCardProps {
  course: Course
  onUpdate: (updates: Partial<Course>) => void
  onRemove: () => void
  onStatusChange: (status: Course["status"]) => void
}

export function CompletedCourseCard({ course, onUpdate, onRemove, onStatusChange }: CompletedCourseCardProps) {
  const { toast } = useToast()

  const handleMoveToInProgress = () => {
    onStatusChange("in-progress")
    toast({
      title: "Course Restored",
      description: `"${course.title}" moved back to In Progress`,
    })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: course info with checkmark */}
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground break-words">{course.title}</h3>
              <Badge variant="outline" className="text-xs mt-2 inline-block">
                {course.platform}
              </Badge>
            </div>
          </div>

          {/* Right side: actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleMoveToInProgress}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Completion info section */}
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Completed On</p>
              <p className="text-sm font-medium">{new Date(course.targetDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Study Time Invested</p>
              <p className="text-sm font-medium">{course.studiedHours.toFixed(1)} hours</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-sm font-medium">100% Complete</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

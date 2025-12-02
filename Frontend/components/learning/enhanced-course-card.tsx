"use client"

import { useState } from "react"
import {
  ChevronDown,
  Clock,
  MoreVertical,
  Star,
  CheckCircle2,
  Pause,
  Trash2,
  BookOpen,
  Share2,
  Award,
  Heart,
  Play,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { StudyTimer } from "./study-timer"
import { toast } from "sonner"

interface Lesson {
  id: string
  title: string
  duration: number // in minutes
  status: "not-started" | "in-progress" | "completed"
  notes?: string
}

interface CourseModule {
  id: string
  title: string
  lessons: Lesson[]
}

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
  modules?: CourseModule[]
  isFavorite?: boolean
}

interface EnhancedCourseCardProps {
  course: Course
  onUpdate: (updates: Partial<Course>) => void
  onRemove: () => void
  onStatusChange: (status: Course["status"]) => void
}

const statusColors = {
  "not-started": "bg-gray-500",
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  paused: "bg-yellow-500",
  dropped: "bg-red-500",
}

// Mock modules with lessons
const mockModules: CourseModule[] = [
  {
    id: "m1",
    title: "Section 1: Introduction",
    lessons: [
      { id: "l1", title: "Course Overview", duration: 15, status: "completed" },
      { id: "l2", title: "Setup & Installation", duration: 30, status: "completed" },
      { id: "l3", title: "Core Concepts", duration: 45, status: "in-progress" },
      { id: "l4", title: "First Project", duration: 60, status: "not-started" },
      { id: "l5", title: "Q&A Session", duration: 20, status: "not-started" },
    ],
  },
  {
    id: "m2",
    title: "Section 2: Advanced Topics",
    lessons: [
      { id: "l6", title: "Performance Optimization", duration: 50, status: "not-started" },
      { id: "l7", title: "Best Practices", duration: 40, status: "not-started" },
      { id: "l8", title: "Real-world Applications", duration: 75, status: "not-started" },
    ],
  },
]

export function EnhancedCourseCard({ course, onUpdate, onRemove, onStatusChange }: EnhancedCourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState(course.notes)
  const [rating, setRating] = useState(course.rating || 0)
  const [showLessons, setShowLessons] = useState(false)
  const [modules, setModules] = useState<CourseModule[]>(course.modules || mockModules)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>({})
  const [isResourcesDialogOpen, setIsResourcesDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false)
  const [isLessonNotesOpen, setIsLessonNotesOpen] = useState(false)
  const [notesLessonId, setNotesLessonId] = useState<string | null>(null)
  const [notesLessonTitle, setNotesLessonTitle] = useState<string>("")
  const [notesContent, setNotesContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFavorite, setIsFavorite] = useState(course.isFavorite || false)

  const completionPercentage = course.totalHours > 0 ? (course.studiedHours / course.totalHours) * 100 : 0

  // Calculate lesson stats
  const allLessons = modules.flatMap((m) => m.lessons)
  const completedLessons = allLessons.filter((l) => l.status === "completed").length
  const totalLessons = allLessons.length
  const totalLessonMinutes = allLessons.reduce((sum, l) => sum + l.duration, 0)
  const totalLessonHours = totalLessonMinutes / 60
  const timeRemaining = Math.max(0, course.totalHours - course.studiedHours)
  const avgTimePerLesson = totalLessons > 0 ? totalLessonMinutes / totalLessons / 60 : 0

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    onUpdate({ notes: newNotes })
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    onUpdate({ rating: newRating })
  }

  const handleLessonStatusChange = (lessonId: string, newStatus: Lesson["status"]) => {
    setModules(
      modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, status: newStatus } : l)),
      })),
    )
  }

  const handleSetActiveLesson = (lesson: Lesson) => {
    setActiveLesson(lesson)
    toast(`Lesson set as active: ${lesson.title}`, { duration: 3000 })
  }

  const handleSaveSessionWithLesson = (hoursLogged: number) => {
    const newStudiedHours = course.studiedHours + hoursLogged
    onUpdate({ studiedHours: newStudiedHours })
    if (activeLesson) {
      handleLessonStatusChange(activeLesson.id, "in-progress")
    }
  }

  const handleToggleFavorite = () => {
    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)
    onUpdate({ isFavorite: newFavoriteState })
    toast({
      title: newFavoriteState ? "Added to Favorites" : "Removed from Favorites",
      description: newFavoriteState
        ? `"${course.title}" added to your favorites`
        : `"${course.title}" removed from favorites`,
    })
  }

  const handleStatusChange = (newStatus: Course["status"]) => {
    onStatusChange(newStatus)

    if (newStatus === "completed") {
      toast.success(`Course completed: ${course.title}`, { duration: 3000 })
    } else if (newStatus === "paused") {
      toast(`Course paused: ${course.title}`, { duration: 3000 })
    } else if (newStatus === "in-progress") {
      toast.success(`Course moved to In Progress: ${course.title}`, { duration: 3000 })
    } else {
      toast(`Course status changed to ${newStatus}: ${course.title}`, { duration: 3000 })
    }
  }

  const handleRemoveCourse = () => {
    toast(`Course removed: ${course.title}`, { duration: 3000 })
    onRemove()
  }

  const handleOpenLessonNotes = (lesson: Lesson) => {
    setNotesLessonId(lesson.id)
    setNotesLessonTitle(lesson.title)
    setNotesContent(lessonNotes[lesson.id] || "")
    setIsLessonNotesOpen(true)
  }

  const handleSaveLessonNotes = () => {
    if (notesLessonId) {
      setLessonNotes({
        ...lessonNotes,
        [notesLessonId]: notesContent,
      })
      setIsLessonNotesOpen(false)
      toast({
        title: "Notes saved",
        description: `Notes for "${notesLessonTitle}" have been saved`,
        variant: "default",
      })
    }
  }

  const filteredLessons = allLessons.filter((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 -mt-1 flex-wrap">
                <h3 className="text-lg font-semibold leading-tight">{course.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {course.platform}
                </Badge>
                <Badge className={`${statusColors[course.status]} text-white text-xs`}>
                  {course.status.replace("-", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Target: {new Date(course.targetDate).toLocaleDateString()}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("paused")}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Course
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRemoveCourse} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} max={100} className="h-2" />
          </div>

          {/* Study Hours */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {course.studiedHours.toFixed(1)}h / {course.totalHours}h studied
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isFavorite ? "default" : "outline"} size="icon" onClick={handleToggleFavorite}>
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFavorite ? "Remove from Favorites" : "Add to Favorites"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsResourcesDialogOpen(true)}>
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Find Supplementary Resources</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsShareDialogOpen(true)}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Course Progress</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={course.status !== "completed"}
                    onClick={() => setIsCertificateDialogOpen(true)}
                  >
                    <Award className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {course.status === "completed" ? "View Certificate" : "Complete course to unlock"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Study Timer */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Currently Studying: {activeLesson ? activeLesson.title : "Select a lesson to begin studying"}
            </p>
            <StudyTimer courseId={course.id} onUpdate={onUpdate} onSessionSaved={handleSaveSessionWithLesson} />
          </div>

          {/* Expandable Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            {isExpanded ? "Hide Details" : "Show Details"}
          </button>

          {/* Expandable Content */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h4 className="text-sm font-semibold mb-4">Lessons & Progress</h4>

                {/* Summary Dashboard */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Overall Completion</span>
                      <span className="text-xs text-muted-foreground">{Math.round(completionPercentage)}%</span>
                    </div>
                    <Progress value={completionPercentage} max={100} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Lessons Completed</p>
                      <p className="text-lg font-semibold">
                        {completedLessons} / {totalLessons}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Hours Studied</p>
                      <p className="text-lg font-semibold">
                        {course.studiedHours.toFixed(1)}h / {course.totalHours}h
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Time Remaining</p>
                      <p className="text-lg font-semibold">~{timeRemaining.toFixed(1)}h</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Avg. Time Per Lesson</p>
                      <p className="text-lg font-semibold">~{avgTimePerLesson.toFixed(0)}m</p>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <Input
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>

                {/* Lessons Accordion */}
                <Accordion type="single" collapsible className="w-full">
                  {modules.map((module) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-medium">{module.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {module.lessons.filter((l) => l.status === "completed").length}/{module.lessons.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {module.lessons
                            .filter((l) => !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                                  activeLesson?.id === lesson.id
                                    ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                                    : ""
                                }`}
                              >
                                {/* Status Icon */}
                                <button
                                  onClick={() => {
                                    const statuses: Lesson["status"][] = ["not-started", "in-progress", "completed"]
                                    const currentIndex = statuses.indexOf(lesson.status)
                                    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
                                    handleLessonStatusChange(lesson.id, nextStatus)
                                  }}
                                  className="flex-shrink-0 transition-colors"
                                >
                                  {lesson.status === "completed" ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : lesson.status === "in-progress" ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                  )}
                                </button>

                                {/* Lesson Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{lesson.title}</p>
                                    {activeLesson?.id === lesson.id && (
                                      <Badge className="bg-blue-500 text-white text-xs">Active</Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Duration Badge */}
                                <Badge variant="outline" className="text-xs">
                                  {lesson.duration}m
                                </Badge>

                                {/* Action Buttons */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSetActiveLesson(lesson)}
                                  className="text-xs h-7 gap-1"
                                  title="Set as active lesson"
                                >
                                  <Play className="w-3 h-3" />
                                  Set Active
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenLessonNotes(lesson)}
                                  className="text-xs h-7 gap-1 relative"
                                  title="Add or view notes"
                                >
                                  <FileText className="w-3 h-3" />
                                  Notes
                                  {lessonNotes[lesson.id] && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </Button>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Personal Notes */}
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
      </CardContent>

      {/* Resources Dialog */}
      <Dialog open={isResourcesDialogOpen} onOpenChange={setIsResourcesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supplementary Resources</DialogTitle>
            <DialogDescription>AI-generated learning resources for {course.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border">
              <p className="font-medium text-sm mb-1">YouTube Playlists</p>
              <p className="text-xs text-muted-foreground">Advanced React Patterns - 15 videos</p>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <p className="font-medium text-sm mb-1">Articles & Blogs</p>
              <p className="text-xs text-muted-foreground">React Performance Optimization Guide</p>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <p className="font-medium text-sm mb-1">Practice Platforms</p>
              <p className="text-xs text-muted-foreground">LeetCode React Problems</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResourcesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Course Progress</DialogTitle>
            <DialogDescription>Share your learning journey with others</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
              <p className="font-semibold mb-2">{course.title}</p>
              <p className="text-sm text-muted-foreground mb-3">{Math.round(completionPercentage)}% Complete</p>
              <Progress value={completionPercentage} max={100} className="h-2 mb-3" />
              <p className="text-xs text-muted-foreground">
                {course.studiedHours.toFixed(1)}h / {course.totalHours}h
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" size="sm">
                Share on X
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" size="sm">
                Share on LinkedIn
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" size="sm">
                Download Image
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate Dialog */}
      <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Course Certificate</DialogTitle>
          </DialogHeader>
          <div className="p-8 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-2 border-yellow-200 dark:border-yellow-800 text-center">
            <p className="text-sm text-muted-foreground mb-2">Certificate of Completion</p>
            <p className="text-2xl font-bold mb-4">{course.title}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Completed on {new Date(course.targetDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">Issued by {course.platform}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCertificateDialogOpen(false)}>
              Close
            </Button>
            <Button>Download Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLessonNotesOpen} onOpenChange={setIsLessonNotesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notes: {notesLessonTitle}</DialogTitle>
            <DialogDescription>Add or edit notes for this lesson</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Write your notes here..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">{notesContent.length} characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonNotesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLessonNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

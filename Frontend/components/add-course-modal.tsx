"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"

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

interface AddCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (course: Omit<Course, "id">) => void
}

export function AddCourseModal({ isOpen, onClose, onAdd }: AddCourseModalProps) {
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    status: "not-started",
    progress: 0,
  })

  const handleAdd = () => {
    if (!newCourse.title || !newCourse.platform) return

    onAdd({
      title: newCourse.title,
      platform: newCourse.platform,
      totalHours: newCourse.totalHours || 0,
      studiedHours: newCourse.studiedHours || 0,
      progress: newCourse.progress || 0,
      status: newCourse.status as Course["status"],
      targetDate: newCourse.targetDate,
      notes: newCourse.notes,
      rating: newCourse.rating,
    })

    setNewCourse({ status: "not-started", progress: 0 })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>Add a course to your learning path</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Course Title</label>
            <Input
              placeholder="e.g., Advanced React Patterns"
              value={newCourse.title || ""}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Platform</label>
            <Select
              value={newCourse.platform || ""}
              onValueChange={(value) => setNewCourse({ ...newCourse, platform: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Udemy">Udemy</SelectItem>
                <SelectItem value="Coursera">Coursera</SelectItem>
                <SelectItem value="LinkedIn Learning">LinkedIn Learning</SelectItem>
                <SelectItem value="Pluralsight">Pluralsight</SelectItem>
                <SelectItem value="edX">edX</SelectItem>
                <SelectItem value="Frontend Masters">Frontend Masters</SelectItem>
                <SelectItem value="Educative">Educative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Total Hours</label>
              <Input
                type="number"
                placeholder="0"
                value={newCourse.totalHours || ""}
                onChange={(e) => setNewCourse({ ...newCourse, totalHours: Number.parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Studied Hours</label>
              <Input
                type="number"
                placeholder="0"
                value={newCourse.studiedHours || ""}
                onChange={(e) => setNewCourse({ ...newCourse, studiedHours: Number.parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={newCourse.status || "not-started"}
              onValueChange={(value) => setNewCourse({ ...newCourse, status: value as Course["status"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Target Completion Date</label>
            <DatePicker
              value={newCourse.targetDate || ""}
              onChange={(date) => setNewCourse({ ...newCourse, targetDate: date })}
              placeholder="Select target date"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Input
              placeholder="Add any notes about this course"
              value={newCourse.notes || ""}
              onChange={(e) => setNewCourse({ ...newCourse, notes: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Add Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

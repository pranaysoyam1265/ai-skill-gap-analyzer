"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { DatePicker } from "@/components/ui/date-picker"

interface Goal {
  id: string
  skill: string
  source: "gap-analysis" | "dashboard"
  proficiency?: number
  targetDate?: string
  status: "active" | "completed" | "paused"
  description?: string
  category?: string
  timeCommitment?: string
}

interface EditGoalModalProps {
  isOpen: boolean
  goal: Goal | null
  onClose: () => void
  onSave: (goal: Goal) => void
}

export function EditGoalModal({ isOpen, goal, onClose, onSave }: EditGoalModalProps) {
  const [formData, setFormData] = useState<Goal | null>(null)

  useEffect(() => {
    if (goal) {
      setFormData({ ...goal })
    }
  }, [goal, isOpen])

  const handleSave = () => {
    if (formData) {
      onSave(formData)
      onClose()
    }
  }

  if (!formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Goal: {formData.skill}</DialogTitle>
          <DialogDescription>Update your goal details and targets</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Goal Title</label>
            <Input
              value={formData.skill}
              onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What do you want to achieve?"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Input
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Software Architecture"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Target Proficiency Level</label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[formData.proficiency || 50]}
                onValueChange={(value) => setFormData({ ...formData, proficiency: value[0] })}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{formData.proficiency || 50}%</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Weekly Time Commitment</label>
            <Select
              value={formData.timeCommitment || "5-10 hours/week"}
              onValueChange={(value) => setFormData({ ...formData, timeCommitment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5 hours/week">1-5 hours/week</SelectItem>
                <SelectItem value="5-10 hours/week">5-10 hours/week</SelectItem>
                <SelectItem value="10-15 hours/week">10-15 hours/week</SelectItem>
                <SelectItem value="15+ hours/week">15+ hours/week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Target Date</label>
            <DatePicker
              value={formData.targetDate || ""}
              onChange={(date) => setFormData({ ...formData, targetDate: date })}
              placeholder="Select target date"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as Goal["status"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

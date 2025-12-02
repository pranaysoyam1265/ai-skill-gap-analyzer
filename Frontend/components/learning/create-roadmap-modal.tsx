"use client"

import { useState } from "react"
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

interface SkillForRoadmap {
  id: string
  skill: string
  proficiency: number
}

interface CreateRoadmapModalProps {
  isOpen: boolean
  skill: SkillForRoadmap | null
  onClose: () => void
  onCreate: (data: {
    startDate: string
    endDate: string
    proficiencyLevel: string
    timeCommitment: number
    learningStyle: string
    platforms: string[]
    goals: string
  }) => void
}

export function CreateRoadmapModal({ isOpen, skill, onClose, onCreate }: CreateRoadmapModalProps) {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    proficiencyLevel: "Advanced",
    timeCommitment: 10,
    learningStyle: "Balanced",
    platforms: [] as string[],
    goals: "",
  })

  const platforms = ["Udemy", "Coursera", "YouTube", "Documentation", "Books", "Projects"]

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleCreate = () => {
    if (formData.startDate && formData.endDate) {
      onCreate(formData)
      setFormData({
        startDate: "",
        endDate: "",
        proficiencyLevel: "Advanced",
        timeCommitment: 10,
        learningStyle: "Balanced",
        platforms: [],
        goals: "",
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Your Roadmap for {skill?.skill}</DialogTitle>
          <DialogDescription>Set your learning timeline and preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Target Proficiency Level</label>
            <Select
              value={formData.proficiencyLevel}
              onValueChange={(value) => setFormData({ ...formData, proficiencyLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Weekly Time Commitment</label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[formData.timeCommitment]}
                onValueChange={(value) => setFormData({ ...formData, timeCommitment: value[0] })}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16">{formData.timeCommitment}h/week</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Learning Style</label>
            <Select
              value={formData.learningStyle}
              onValueChange={(value) => setFormData({ ...formData, learningStyle: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Project-based">Project-based</SelectItem>
                <SelectItem value="Theoretical">Theoretical</SelectItem>
                <SelectItem value="Balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Platforms</label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => handlePlatformToggle(platform)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    formData.platforms.includes(platform)
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Specific Goals</label>
            <textarea
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="e.g., Build a scalable microservice, Pass certification exam"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Roadmap</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

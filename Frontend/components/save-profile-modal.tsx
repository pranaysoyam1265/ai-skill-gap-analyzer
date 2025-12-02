"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, CheckCircle } from "lucide-react"
import type { SkillData } from "@/lib/export-utils"

interface SaveProfileModalProps {
  skills: SkillData[]
  trigger?: React.ReactNode
}

export function SaveProfileModal({ skills, trigger }: SaveProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [profileDescription, setProfileDescription] = useState("")

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call to save profile
      const profileData = {
        name: profileName,
        description: profileDescription,
        skills: skills,
        createdAt: new Date().toISOString(),
      }

      // In a real app, this would be sent to a backend API
      console.log("Saving profile:", profileData)

      // Store in localStorage for demo purposes
      const profiles = JSON.parse(localStorage.getItem("skillProfiles") || "[]")
      profiles.push(profileData)
      localStorage.setItem("skillProfiles", JSON.stringify(profiles))

      setIsSaved(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsSaved(false)
        setProfileName("")
        setProfileDescription("")
      }, 2000)
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 bg-transparent">
            <Save className="w-4 h-4" />
            Save to Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Skills Analysis to Profile</DialogTitle>
          <DialogDescription>Create a snapshot of your current skills analysis</DialogDescription>
        </DialogHeader>

        {isSaved ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="text-center font-semibold">Profile saved successfully!</p>
            <p className="text-center text-sm text-muted-foreground">
              You can access this snapshot anytime from your profile history.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g., Q4 2024 Skills Assessment"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-description">Description (Optional)</Label>
              <Textarea
                id="profile-description"
                placeholder="Add notes about this analysis..."
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
              <p className="text-blue-300">
                This will save a snapshot of your {skills.length} skills with all current metrics and recommendations.
              </p>
            </div>

            <Button onClick={handleSave} disabled={!profileName || isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

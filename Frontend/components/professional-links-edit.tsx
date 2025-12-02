"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Linkedin, Globe, Twitter, Code, BookOpen, Edit2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfessionalLink {
  platform: string
  url: string
}

interface ProfessionalLinksEditProps {
  links: ProfessionalLink[]
  onSave: (links: ProfessionalLink[]) => Promise<void>
}

const PLATFORMS = [
  { id: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/username" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
  { id: "portfolio", label: "Portfolio", icon: Globe, placeholder: "https://example.com" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, placeholder: "https://twitter.com/username" },
  { id: "stackoverflow", label: "Stack Overflow", icon: Code, placeholder: "https://stackoverflow.com/users/userid" },
  { id: "blog", label: "Personal Blog", icon: BookOpen, placeholder: "https://blog.example.com" },
]

export function ProfessionalLinksEdit({ links, onSave }: ProfessionalLinksEditProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [editLinks, setEditLinks] = useState<ProfessionalLink[]>(links)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleLinkChange = (platform: string, url: string) => {
    setEditLinks((prev) => {
      const existing = prev.findIndex((l) => l.platform === platform)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { platform, url }
        return updated
      }
      return [...prev, { platform, url }]
    })
    if (errors[platform]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
    }
  }

  const handleRemoveLink = (platform: string) => {
    setEditLinks((prev) => prev.filter((l) => l.platform !== platform))
    if (errors[platform]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
    }
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}

    // Validate non-empty URLs
    for (const link of editLinks) {
      if (link.url.trim() && !validateUrl(link.url)) {
        newErrors[link.platform] = "Invalid URL format"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: "Validation Error",
        description: "Please fix invalid URLs",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(editLinks.filter((l) => l.url.trim()))
      setIsOpen(false)
      toast({
        title: "Success",
        description: "Professional links updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving links:", error)
      toast({
        title: "Error",
        description: "Failed to save professional links",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Edit2 className="w-4 h-4 flex-shrink-0" />
          Edit Links
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Professional Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const link = editLinks.find((l) => l.platform === platform.id)
            const Icon = platform.icon
            const error = errors[platform.id]

            return (
              <div key={platform.id} className="space-y-1">
                <Label className="flex items-center gap-2 text-foreground/70">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {platform.label}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder={platform.placeholder}
                    value={link?.url || ""}
                    onChange={(e) => handleLinkChange(platform.id, e.target.value)}
                    className={error ? "border-destructive" : ""}
                  />
                  {link && link.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveLink(platform.id)}
                      className="text-destructive hover:text-destructive/80 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

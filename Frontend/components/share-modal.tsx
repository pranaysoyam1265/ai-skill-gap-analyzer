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
import { Share2, Copy, Check, Mail, Linkedin, Twitter } from "lucide-react"
import { generateShareableLink, copyToClipboard, type SkillData } from "@/lib/export-utils"

interface ShareModalProps {
  skills: SkillData[]
  trigger?: React.ReactNode
}

export function ShareModal({ skills, trigger }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareLink = generateShareableLink(skills)

  const handleCopy = async () => {
    await copyToClipboard(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    const text = "Check out my AI Skill Gap Analysis!"
    const encodedText = encodeURIComponent(text)
    const encodedLink = encodeURIComponent(shareLink)

    let url = ""
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`
        break
      case "email":
        url = `mailto:?subject=${encodedText}&body=${encodedLink}`
        break
    }

    if (url) {
      window.open(url, "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share Analysis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Skills Analysis</DialogTitle>
          <DialogDescription>Share your analysis with others or on social media</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Shareable Link</label>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="text-xs" />
              <Button size="sm" onClick={handleCopy} variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Share On</label>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => handleShare("twitter")} variant="outline" className="gap-2" size="sm">
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button onClick={() => handleShare("linkedin")} variant="outline" className="gap-2" size="sm">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
              <Button onClick={() => handleShare("email")} variant="outline" className="gap-2" size="sm">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

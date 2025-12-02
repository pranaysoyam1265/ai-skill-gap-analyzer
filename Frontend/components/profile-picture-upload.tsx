"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfilePictureUploadProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (croppedImageUrl: string) => Promise<void>
  fullName: string
  isUploading?: boolean // Add optional isUploading prop
}

export function ProfilePictureUpload({
  isOpen,
  onClose,
  onUpload,
  fullName,
  isUploading = false, // Provide default value
}: ProfilePictureUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const handleCropAndUpload = async () => {
    if (!canvasRef.current || !previewUrl) return

    try {
      setIsProcessing(true)

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = async () => {
        // Draw cropped square (400x400px)
        const size = Math.min(img.width, img.height) * zoom
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2

        canvas.width = 400
        canvas.height = 400
        ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400)

        // Convert to blob and create data URL
        canvas.toBlob(
          async (blob) => {
            if (!blob) return

            const reader = new FileReader()
            reader.onload = async () => {
              const croppedDataUrl = reader.result as string
              await onUpload(croppedDataUrl)
              setSelectedFile(null)
              setPreviewUrl(null)
              setZoom(1)
              setIsProcessing(false)
            }
            reader.readAsDataURL(blob)
          },
          "image/jpeg",
          0.9,
        )
      }
      img.src = previewUrl
    } catch (error) {
      console.error("[v0] Error cropping image:", error)
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>

          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center gap-3"
              >
                <Camera className="w-8 h-8 text-primary/60" />
                <p className="text-sm text-foreground/70">Click to select an image or drag and drop</p>
                <p className="text-xs text-foreground/50">JPEG, PNG, or WebP • Max 5MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full aspect-square bg-secondary/20 rounded-lg overflow-hidden">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground/70">Zoom</label>
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setZoom(1)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCropAndUpload}
                  disabled={isUploading || isProcessing}
                  className="flex-1 bg-primary hover:bg-primary/90 px-6 py-2.5 h-auto"
                >
                  {isUploading || isProcessing ? "Uploading..." : "Upload Photo"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}

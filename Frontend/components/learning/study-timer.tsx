"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { toast } from "sonner"

interface StudyTimerProps {
  courseId: string
  onUpdate: (updates: { studiedHours?: number; manuallyLoggedHours?: number }) => void
  onSessionSaved?: (hoursLogged: number) => void
}

export function StudyTimer({ courseId, onUpdate, onSessionSaved }: StudyTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, isPaused])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setIsPaused(false)
    toast("Study timer started")
  }

  const handlePause = () => {
    const newPausedState = !isPaused
    setIsPaused(newPausedState)
    toast(newPausedState ? "Timer paused" : "Timer resumed")
  }

  const handleSaveSession = () => {
    const hoursStudied = elapsedSeconds / 3600
    const minutesStudied = Math.round((elapsedSeconds % 3600) / 60)

    onUpdate({ studiedHours: hoursStudied })

    if (onSessionSaved) {
      onSessionSaved(hoursStudied)
    }

    if (minutesStudied > 0) {
      toast.success(`Study session saved: ${minutesStudied} minutes`)
    } else {
      toast.success(`Study session saved: ${hoursStudied.toFixed(2)} hours`)
    }

    setIsRunning(false)
    setIsPaused(false)
    setElapsedSeconds(0)
  }

  const handleStop = () => {
    setIsRunning(false)
    setIsPaused(false)
    setElapsedSeconds(0)
    toast("Timer reset")
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="text-sm font-mono font-semibold">{formatTime(elapsedSeconds)}</div>
      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          disabled={isRunning && !isPaused}
          className="min-w-[60px] bg-transparent"
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePause}
          disabled={!isRunning}
          className="min-w-[60px] bg-transparent"
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSaveSession}
          disabled={elapsedSeconds === 0}
          className="min-w-[80px] bg-transparent"
        >
          Save Session
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          disabled={!isRunning}
          className="min-w-[60px] bg-transparent"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

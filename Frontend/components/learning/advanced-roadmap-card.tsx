"use client"

import { useState } from "react"
import { ChevronDown, MoreVertical, Trash2, Pause, Play, Calendar, Clock, Target, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface RoadmapPhase {
  id: string
  name: string
  duration: string
  objectives: string[]
  resources: string[]
  completed: boolean
}

interface Roadmap {
  id: string
  title: string
  skill: string
  status: "active" | "completed" | "paused" | "ready"
  phases: RoadmapPhase[]
  startDate: string
  targetDate: string
}

interface AdvancedRoadmapCardProps {
  roadmap: Roadmap
  onPhaseToggle: (phaseId: string, completed: boolean) => void
  onStatusChange: (status: "active" | "paused") => void
  onDelete: () => void
  onViewActionPlan: () => void
  isSelected?: boolean
}

export function AdvancedRoadmapCard({
  roadmap,
  onPhaseToggle,
  onStatusChange,
  onDelete,
  onViewActionPlan,
  isSelected = false,
}: AdvancedRoadmapCardProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const completedPhases = roadmap.phases.filter((p) => p.completed).length
  const totalPhases = roadmap.phases.length
  const progressPercentage = (completedPhases / totalPhases) * 100

  const startDate = new Date(roadmap.startDate)
  const endDate = new Date(roadmap.targetDate)
  const today = new Date()
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const timelineProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))

  const statusConfig = {
    active: {
      badge: "default",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      accentColor: "from-blue-500 to-blue-600",
    },
    paused: {
      badge: "secondary",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      accentColor: "from-yellow-500 to-yellow-600",
    },
    completed: {
      badge: "secondary",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      accentColor: "from-green-500 to-green-600",
    },
  }

  const config = statusConfig[roadmap.status]

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 border-2 ${config.borderColor} ${config.bgColor} bg-card text-card-foreground ${
        isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="text-xl">{roadmap.title}</CardTitle>
              <Badge variant={config.badge as any}>{roadmap.status}</Badge>
              {isSelected && (
                <Badge variant="default" className="bg-blue-500">
                  Action Plan Active
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {totalDays} days
              </span>
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onViewActionPlan}>
                <Eye className="w-4 h-4 mr-2" />
                View Action Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(roadmap.status === "active" ? "paused" : "active")}>
                {roadmap.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Roadmap
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Roadmap
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Roadmap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Overall Progress
              </span>
              <span className="text-sm font-medium">
                {completedPhases} / {totalPhases} phases
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${config.accentColor} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Timeline Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.max(0, totalDays - elapsedDays)} days remaining
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${timelineProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Learning Phases</h4>
          <div className="space-y-2">
            {roadmap.phases.map((phase, idx) => (
              <Collapsible
                key={phase.id}
                open={expandedPhase === phase.id}
                onOpenChange={(open) => setExpandedPhase(open ? phase.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-all duration-200 group">
                    {/* Phase Number/Status */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        phase.completed
                          ? "bg-green-500 text-white"
                          : idx === 0
                            ? `bg-gradient-to-br ${config.accentColor} text-white`
                            : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {phase.completed ? "✓" : idx + 1}
                    </div>

                    {/* Phase Info */}
                    <div className="flex-1 text-left">
                      <h5
                        className={`font-semibold text-sm ${phase.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {phase.name}
                      </h5>
                      <p className="text-xs text-muted-foreground">{phase.duration}</p>
                    </div>

                    {/* Checkbox and Chevron */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={phase.completed ?? false}
                        onChange={(e) => {
                          e.stopPropagation()
                          onPhaseToggle(phase.id, !phase.completed)
                        }}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${expandedPhase === phase.id ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-3 pl-11 pr-3 pb-3 space-y-4 bg-muted/30 rounded-b-lg">
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Learning Objectives
                    </p>
                    <ul className="text-sm space-y-1">
                      {phase.objectives.map((obj, idx) => (
                        <li key={idx} className="text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Resources
                    </p>
                    <ul className="text-sm space-y-1">
                      {phase.resources.map((res, idx) => (
                        <li key={idx} className="text-muted-foreground flex gap-2">
                          <span className="text-primary">→</span>
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm font-medium">Completion Status</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {roadmap.phases.map((phase) => (
                <div
                  key={phase.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    phase.completed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">{progressPercentage.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"
import { ChevronDown, MoreVertical, Trash2, CheckCircle2 } from "lucide-react"
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
  status: "active" | "completed" | "paused"
  phases: RoadmapPhase[]
  startDate: string
  targetDate: string
}

interface RoadmapCardProps {
  roadmap: Roadmap
  onPhaseToggle: (phaseId: string, completed: boolean) => void
  onStatusChange: (status: "active" | "paused") => void
  onDelete: () => void
}

export function RoadmapCard({ roadmap, onPhaseToggle, onStatusChange, onDelete }: RoadmapCardProps) {
  const completedPhases = roadmap.phases.filter((p) => p.completed).length
  const totalPhases = roadmap.phases.length
  const progressPercentage = (completedPhases / totalPhases) * 100

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{roadmap.title}</CardTitle>
            <CardDescription>
              {new Date(roadmap.startDate).toLocaleDateString()} - {new Date(roadmap.targetDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={roadmap.status === "active" ? "default" : "secondary"}>{roadmap.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onStatusChange(roadmap.status === "active" ? "paused" : "active")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {roadmap.status === "active" ? "Set as Inactive" : "Set as Active"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Roadmap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timeline Visualization */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            {roadmap.phases.map((phase, idx) => (
              <div key={phase.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    phase.completed
                      ? "bg-green-500 text-white"
                      : idx === 0
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {phase.completed ? "✓" : idx + 1}
                </div>
                <p className="text-xs font-medium mt-2 text-center max-w-20">{phase.name}</p>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedPhases} / {totalPhases} phases
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Phase Details */}
        <div className="space-y-3">
          {roadmap.phases.map((phase) => (
            <Collapsible key={phase.id} defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <input
                      type="checkbox"
                      checked={phase.completed}
                      onChange={(e) => {
                        e.stopPropagation()
                        onPhaseToggle(phase.id, !phase.completed)
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <h4 className={`font-semibold ${phase.completed ? "line-through text-muted-foreground" : ""}`}>
                        {phase.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{phase.duration}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-8 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                  <ul className="text-sm space-y-1">
                    {phase.objectives.map((obj, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        • {obj}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Resources:</p>
                  <ul className="text-sm space-y-1">
                    {phase.resources.map((res, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        • {res}
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

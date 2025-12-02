"use client"
import { MoreVertical, Edit, Eye, Trash2, CheckCircle, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

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

interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onViewDetails: (goal: Goal) => void
  onStatusChange: (id: string, status: Goal["status"]) => void
  onDelete: (id: string) => void
}

export function GoalCard({ goal, onEdit, onViewDetails, onStatusChange, onDelete }: GoalCardProps) {
  const targetProficiency = 85

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left Section - Goal Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg">{goal.skill}</h3>
              <Badge
                variant={goal.status === "active" ? "default" : goal.status === "completed" ? "secondary" : "outline"}
              >
                {goal.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {goal.source === "gap-analysis" ? "Gap Analysis" : "Dashboard"}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>

            {/* Middle Section - Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {goal.category && (
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium text-sm">{goal.category}</p>
                </div>
              )}
              {goal.proficiency !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="font-medium text-sm">{goal.proficiency}%</p>
                </div>
              )}
              {targetProficiency && (
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium text-sm">{targetProficiency}%</p>
                </div>
              )}
              {goal.timeCommitment && (
                <div>
                  <p className="text-xs text-muted-foreground">Time/Week</p>
                  <p className="font-medium text-sm">{goal.timeCommitment}</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {goal.proficiency !== undefined && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Progress</span>
                  <span className="text-xs text-muted-foreground">
                    {goal.proficiency}% / {targetProficiency}%
                  </span>
                </div>
                <Progress value={goal.proficiency} max={targetProficiency} className="h-2" />
              </div>
            )}

            {/* Target Date */}
            {goal.targetDate && (
              <div className="text-xs text-muted-foreground">
                Target Date: <span className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Right Section - Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails(goal)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(goal.id, goal.status === "active" ? "paused" : "active")}>
                {goal.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Goal
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resume Goal
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(goal.id, "completed")}
                disabled={goal.status === "completed"}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

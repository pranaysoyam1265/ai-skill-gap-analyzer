import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}>
      <div className="flex items-start justify-between mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-sm opacity-90">{label}</p>
    </Card>
  )
}

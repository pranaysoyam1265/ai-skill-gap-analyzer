"use client"

import { Card } from "@/components/ui/card"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts"

interface SkillAnalyticsChartsProps {
  radarData: Array<{ name: string; proficiency: number; marketDemand: number }>
  trendData: Array<{ month: string; [key: string]: string | number }>
  categoryDistribution: Array<{ name: string; value: number }>
  proficiencyDistribution: Array<{ name: string; count: number }>
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]

export function ProficiencyVsMarketDemandChart({ radarData }: { radarData: SkillAnalyticsChartsProps["radarData"] }) {
  return (
    <Card className="glass p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Proficiency vs Market Demand</h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <PolarRadiusAxis stroke="rgba(255,255,255,0.7)" />
            <Radar
              name="Proficiency"
              dataKey="proficiency"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.3}
            />
            <Radar
              name="Market Demand"
              dataKey="marketDemand"
              stroke="var(--color-secondary)"
              fill="var(--color-secondary)"
              fillOpacity={0.2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function MarketDemandTrendsChart({ trendData }: { trendData: SkillAnalyticsChartsProps["trendData"] }) {
  return (
    <Card className="glass p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Market Demand Trends (12 Months)</h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="React"
              stackId="1"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="TypeScript"
              stackId="1"
              stroke="var(--color-secondary)"
              fill="var(--color-secondary)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="Python"
              stackId="1"
              stroke="var(--color-accent)"
              fill="var(--color-accent)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function SkillCategoryDistributionChart({
  categoryDistribution,
}: {
  categoryDistribution: SkillAnalyticsChartsProps["categoryDistribution"]
}) {
  return (
    <Card className="glass p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Skill Category Distribution</h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function ProficiencyLevelDistributionChart({
  proficiencyDistribution,
}: {
  proficiencyDistribution: SkillAnalyticsChartsProps["proficiencyDistribution"]
}) {
  return (
    <Card className="glass p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Proficiency Level Distribution</h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={proficiencyDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="var(--color-primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function SkillGrowthChart({ data }: { data: Array<{ month: string; skillCount: number }> }) {
  return (
    <Card className="glass p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Skill Growth Over Time</h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="skillCount"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ fill: "var(--color-primary)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function MarketSaturationChart({
  data,
}: {
  data: Array<{ name: string; saturation: number; demand: number }>
}) {
  return (
    <Card className="glass p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Market Saturation vs Demand</h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="saturation" fill="var(--color-secondary)" />
            <Bar dataKey="demand" fill="var(--color-primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

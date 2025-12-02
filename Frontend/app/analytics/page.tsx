"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import {
  Line,
  LineChart,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { TrendingUp, TrendingDown, Lightbulb, Sparkles, Download, RotateCcw, RefreshCw } from "lucide-react"
import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResumeStore } from "@/lib/stores/resume-store"
import { useToast } from "@/hooks/use-toast"
import { ActiveResumeIndicator } from "@/components/active-resume-indicator"
import { LoadingDialog } from "@/components/loading-dialog"
import { 
  getMarketDemand, 
  getSkillTrend, 
  compareSkillTrends, 
  getTopMovers, 
  getCategoryTrends,
  type SkillTrendResponse,
  type TopMoversResponse,
  type CategoryTrendsResponse
} from "@/lib/api/fastapi-client"

export default function AnalyticsPage() {
  const activeResume = useResumeStore((state) => state.getActiveResume())
  const { toast } = useToast()

  // Single unified loading state - CRITICAL FIX
  const [showLoadingDialog, setShowLoadingDialog] = useState(true)
  const [allDataReady, setAllDataReady] = useState(false)

  // Prevent double execution in React Strict Mode
  const initializationRef = useRef(false)

  // State for real skills from backend
  const [candidateSkills, setCandidateSkills] = useState<any[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [skillsError, setSkillsError] = useState<string | null>(null)

  // State for backend data
  const [marketDemandData, setMarketDemandData] = useState<Record<string, number>>({})
  const [isLoadingMarket, setIsLoadingMarket] = useState(true)
  const [trendDataCache, setTrendDataCache] = useState<Map<string, SkillTrendResponse>>(new Map())
  const [topMoversData, setTopMoversData] = useState<TopMoversResponse | null>(null)
  const [categoryTrendsData, setCategoryTrendsData] = useState<CategoryTrendsResponse | null>(null)
  const [trendChartData, setTrendChartData] = useState<any[]>([])
  const [isLoadingTrends, setIsLoadingTrends] = useState(true)
  const [top8TrendSkills, setTop8TrendSkills] = useState<string[]>([])

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [showYourGrowth, setShowYourGrowth] = useState(true)
  const [showIndustryAvg, setShowIndustryAvg] = useState(true)
  const [selectedBenchmark, setSelectedBenchmark] = useState("industry-average")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isUpdatingChart, setIsUpdatingChart] = useState(false)

  // MASTER EFFECT: Orchestrate all data loading in parallel
  useEffect(() => {
    if (initializationRef.current) return
    initializationRef.current = true

    const loadAllData = async () => {
      const startTime = Date.now()
      console.log('🚀 [Analytics] Starting parallel data load...')

      try {
        // Get candidate ID
        const candidateId = activeResume?.candidateId || 9

        // PARALLEL: Fetch all 3 data sources simultaneously (NOT sequentially)
        const [skillsResult, marketResult, movResult, catResult] = await Promise.allSettled([
          // Fetch candidate skills
          (async () => {
            console.log('📊 Fetching candidate skills...')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/candidates/${candidateId}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            
            if (data?.skills?.detailed) {
              const transformed = data.skills.detailed.map((skill: any) => ({
                id: skill.id,
                name: skill.name,
                category: skill.category,
                proficiency: skill.proficiency === "Expert" ? 5 :
                            skill.proficiency === "Advanced" ? 4 :
                            skill.proficiency === "Intermediate" ? 3 :
                            skill.proficiency === "Beginner" ? 2 : 3,
                years: skill.years || 0,
                marketDemand: 0,
                trend: "stable"
              }))
              console.log('✅ Loaded', transformed.length, 'skills')
              return transformed
            }
            throw new Error("Invalid skills response")
          })(),
          
          // Fetch market demand
          (async () => {
            console.log('📈 Fetching market demand...')
            const data = await getMarketDemand()
            console.log('✅ Loaded market data for', Object.keys(data).length, 'skills')
            return data
          })(),
          
          // Fetch top movers
          (async () => {
            console.log('🔥 Fetching top movers...')
            return await getTopMovers('up', 20, 3)
          })(),
          
          // Fetch category trends
          (async () => {
            console.log('📊 Fetching category trends...')
            return await getCategoryTrends(12)
          })()
        ])

        // Extract results
        let skills: any[] = []
        let market: Record<string, number> = {}
        
        if (skillsResult.status === 'fulfilled') {
          skills = skillsResult.value
          setCandidateSkills(skills)
        } else {
          console.error('❌ Skills fetch failed:', skillsResult.reason)
          setSkillsError(skillsResult.reason?.message || 'Failed to fetch skills')
        }

        if (marketResult.status === 'fulfilled') {
          market = marketResult.value
          setMarketDemandData(market)
        } else {
          console.error('❌ Market fetch failed:', marketResult.reason)
          toast({ title: "Market Data Error", description: "Using fallback data", variant: "destructive" })
        }

        if (movResult.status === 'fulfilled') {
          setTopMoversData(movResult.value)
        }

        if (catResult.status === 'fulfilled') {
          setCategoryTrendsData(catResult.value)
        }

        // Set intermediate flags
        setIsLoadingSkills(false)
        setIsLoadingMarket(false)

        // Now fetch trend data for top 8 skills
        if (skills.length > 0 && Object.keys(market).length > 0) {
          await fetchTrendData(skills, market)
        }

        const totalTime = Date.now() - startTime
        console.log(`✨ [Analytics] All data loaded in ${totalTime}ms`)

        // Signal that all data is ready
        setAllDataReady(true)
        setShowLoadingDialog(false)

      } catch (error) {
        console.error('❌ [Analytics] Data loading failed:', error)
        setShowLoadingDialog(false)
      }
    }

    loadAllData()
  }, [])

  // Separate function to fetch trend data (called after skills & market are ready)
  const fetchTrendData = async (skills: any[], market: Record<string, number>) => {
    try {
      console.log('📉 Fetching trend data...')
      
      // Get top 8 skills by market demand
      const topSkills = skills
        .sort((a, b) => (market[b.name] || 0) - (market[a.name] || 0))
        .slice(0, 8)

      const top8Names = topSkills.map(s => s.name)
      setTop8TrendSkills(top8Names)

      // Parallel trend fetches
      const trendPromises = topSkills.map(async (skill) => {
        try {
          const trendData = await getSkillTrend(skill.name, 12)
          return { skill: skill.name, data: trendData }
        } catch (error) {
          console.warn(`⚠️ No trend data for ${skill.name}`)
          return { skill: skill.name, data: null }
        }
      })

      const results = await Promise.allSettled(trendPromises)
      
      // Build chart data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const chartData = months.map((month, index) => {
        const dataPoint: Record<string, number | string> = { month }
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.data) {
            const skillName = result.value.skill
            const historyEntry = result.value.data.history[index]
            dataPoint[skillName] = historyEntry?.demand_score || 0
          }
        })
        return dataPoint
      })

      setTrendChartData(chartData)
      
      // Update cache
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data) {
          setTrendDataCache(prev => new Map(prev.set(result.value.skill, result.value.data!)))
        }
      })

      console.log('✅ Trend data loaded')
    } catch (error) {
      console.error('❌ Trend fetching failed:', error)
    } finally {
      setIsLoadingTrends(false)
    }
  }

  const activeResumeSkills = candidateSkills

  // Handle skill selection
  useEffect(() => {
    if (activeResumeSkills.length > 0 && selectedSkills.length === 0) {
      setSelectedSkills(activeResumeSkills.slice(0, Math.min(6, activeResumeSkills.length)).map((s) => s.name))
    }
  }, [activeResumeSkills, selectedSkills.length])

  // Data refresh function
  const handleRefreshData = async () => {
    setIsLoadingMarket(true)
    try {
      console.log("🔄 Refreshing market demand data...")
      const data = await getMarketDemand()
      setMarketDemandData(data)
      setTrendDataCache(new Map()) // Clear cache
      
      toast({
        title: "Data Refreshed",
        description: "Market demand data has been updated."
      })
    } catch (error) {
      console.error("❌ Failed to refresh data:", error)
      toast({
        title: "Refresh Failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingMarket(false)
    }
  }

  // Compute detailed skill data with historical trends
  const allSkillsData = useMemo(() => {
    if (activeResumeSkills.length === 0) return []
    return activeResumeSkills.map((skill) => {
      const proficiency = Number(skill.proficiency) || 0
      const marketDemand = marketDemandData[skill.name] || skill.marketDemand || 50
      const growthRate = ((marketDemand - 50) / 50) * 100
      const trendData = trendDataCache.get(skill.name)
      const trendHistory = trendData?.history || []

      return {
        skill: skill.name,
        historicalData: trendHistory.map((entry) => {
          const monthDate = new Date(entry.month)
          return {
            year: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            score: Math.round(entry.demand_score)
          }
        }),
        growthRate: `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%`,
        futureOutlook: trendData?.statistics ? 
          `${skill.name} shows ${trendData.statistics.volatility < 5 ? "stable" : trendData.statistics.percent_change > 10 ? "strong growth" : "moderate"} market demand with ${trendData.statistics.percent_change.toFixed(1)}% change over 12 months.` :
          `Trend data for ${skill.name} not yet loaded. Expand to fetch detailed market analysis.`,
      }
    })
  }, [activeResumeSkills])

  // Compute critical skill gaps
  const criticalGapSkills = useMemo(() => {
    if (activeResumeSkills.length === 0) return []
    return activeResumeSkills
      .map((skill) => {
        const proficiency = Number(skill.proficiency) || 0
        const marketDemand = marketDemandData[skill.name] || skill.marketDemand || 50
        const gap = marketDemand - proficiency * 20
        const trendData = trendDataCache.get(skill.name)
        const trendText = trendData?.statistics ? 
          `${trendData.trend} ${Math.abs(trendData.statistics.percent_change).toFixed(1)}%` :
          "Not available"

        return {
          skill: skill.name,
          demand: marketDemand,
          trend: trendText,
          postings: `${Math.round(marketDemand * 10)} job openings`,
          recommendation:
            gap > 20
              ? "High priority - significant gap to close"
              : gap > 10
                ? "Moderate priority - room for improvement"
                : "Maintain current level",
        }
      })
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10)
  }, [activeResumeSkills])

  // Compute salary impact by skill
  const topSkillsBySalary = useMemo(() => {
    if (activeResumeSkills.length === 0) return []
    return activeResumeSkills
      .map((skill) => {
        const proficiency = Number(skill.proficiency) || 0
        const marketDemand = marketDemandData[skill.name] || skill.marketDemand || 50
        const demandFactor = Math.min(marketDemand / 100, 1)
        const proficiencyFactor = Math.min(proficiency / 5, 1)
        const salaryContribution = Math.round(demandFactor * proficiencyFactor * 400000)

        return {
          skill: skill.name,
          impact: salaryContribution,
          demand: marketDemand,
          proficiency: proficiency,
        }
      })
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 12)
  }, [activeResumeSkills])

  // Compute category distribution
  const skillCategoryData = useMemo(() => {
    if (activeResumeSkills.length === 0) return []
    const top50Skills = activeResumeSkills
      .sort((a, b) => (marketDemandData[b.name] || b.marketDemand || 0) - (marketDemandData[a.name] || a.marketDemand || 0))
      .slice(0, 50)

    const categoryMap = new Map<string, number>()
    top50Skills.forEach((skill) => {
      const category = skill.category || "Other"
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    const colors = [
      "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
      "#06B6D4", "#F97316", "#EF4444", "#A855F7", "#14B8A6",
      "#6366F1", "#D946EF",
    ]
    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length],
    }))
  }, [activeResumeSkills])

  // Compute proficiency distribution
  const proficiencyDistribution = useMemo(() => {
    if (activeResumeSkills.length === 0) return []
    return [
      {
        level: "Expert (90+)",
        count: activeResumeSkills.filter((s) => (Number(s.proficiency) || 0) * 20 >= 90).length,
      },
      {
        level: "Advanced (75-89)",
        count: activeResumeSkills.filter(
          (s) => (Number(s.proficiency) || 0) * 20 >= 75 && (Number(s.proficiency) || 0) * 20 < 90,
        ).length,
      },
      {
        level: "Intermediate (50-74)",
        count: activeResumeSkills.filter(
          (s) => (Number(s.proficiency) || 0) * 20 >= 50 && (Number(s.proficiency) || 0) * 20 < 75,
        ).length,
      },
      {
        level: "Beginner (25-49)",
        count: activeResumeSkills.filter(
          (s) => (Number(s.proficiency) || 0) * 20 >= 25 && (Number(s.proficiency) || 0) * 20 < 50,
        ).length,
      },
    ]
  }, [activeResumeSkills])

  // Compute salary metrics
  const salaryCalculations = useMemo(() => {
    if (topSkillsBySalary.length === 0) {
      return { totalSalary: 0, skillPremium: 0, avgSkillValue: 0 }
    }
    const totalSalaryRupees = topSkillsBySalary.reduce((sum, skill) => sum + skill.impact, 0)
    const totalSalaryLakhs = totalSalaryRupees / 100000
    const totalEstimatedSalary = Math.round(totalSalaryLakhs * 10) / 10
    const cappedSalary = Math.min(totalEstimatedSalary, 50)
    const skillPremium = Math.round(cappedSalary * 0.25 * 10) / 10
    const avgSkillValue = activeResumeSkills.length > 0 ? Math.round((cappedSalary * 100000) / activeResumeSkills.length) : 0

    return { totalSalary: cappedSalary, skillPremium, avgSkillValue }
  }, [topSkillsBySalary, activeResumeSkills.length])

  // Assemble analytics data from computed components
  const analyticsData = useMemo(() => {
    return {
      allSkillsData,
      criticalGapSkills,
      topSkillsBySalary,
      skillCategoryData,
      proficiencyDistribution,
      ...salaryCalculations,
    }
  }, [allSkillsData, criticalGapSkills, topSkillsBySalary, skillCategoryData, proficiencyDistribution, salaryCalculations])

  const aiExecutiveSummary = useMemo(() => {
    if (activeResumeSkills.length === 0) {
      return "Upload and analyze a resume to see personalized insights and recommendations."
    }

    // Get top 3 skills by demand
    const top3SkillsByDemand = activeResumeSkills
      .sort((a, b) => {
        const demandA = marketDemandData[a.name] || a.marketDemand || 0
        const demandB = marketDemandData[b.name] || b.marketDemand || 0
        return demandB - demandA
      })
      .slice(0, 3)
      .map((s) => s.name)
      .join(", ")

    // Get rising skills (trend = "up")
    const risingSkills = activeResumeSkills
      .filter((s) => s.trend === "up")
      .slice(0, 2)
      .map((s) => s.name)
      .join(" and ")

    // Calculate average market demand
    const avgMarketDemand =
      activeResumeSkills.reduce((sum, s) => sum + (marketDemandData[s.name] || s.marketDemand || 50), 0) /
      activeResumeSkills.length

    // Determine proficiency level
    const proficiencyLevel = avgMarketDemand > 80 ? "strong" : avgMarketDemand > 60 ? "developing" : "foundational"
    const proficiencyText = proficiencyLevel === "strong" ? "strongly" : proficiencyLevel === "developing" ? "well" : "with"

    // Build the insight
    let insight = `Your expertise in ${top3SkillsByDemand} positions you ${proficiencyText} for senior roles.`

    if (risingSkills) {
      insight += ` The rising demand for ${risingSkills} creates excellent opportunities.`
    }

    insight += ` Your skill portfolio shows a ${proficiencyLevel} foundation with an estimated salary potential of ₹${analyticsData.totalSalary}L. Focus on high-demand skills to maximize your market value.`

    return insight
  }, [activeResumeSkills, analyticsData.totalSalary, marketDemandData])

  const salaryMetrics = [
    {
      label: "Total Estimated Salary",
      value: `₹${analyticsData.totalSalary}L`,
      subtext: `${analyticsData.totalSalary} LPA`,
      trend: "+12% vs last year",
    },
    {
      label: "Skill Premium Value",
      value: `₹${analyticsData.skillPremium}L`,
      subtext: `${analyticsData.skillPremium}L additional`,
      trend: "+8% vs last year",
    },
    {
      label: "Average Skill Value",
      value: `₹${(analyticsData.avgSkillValue / 1000).toFixed(0)}K`,
      subtext: "per skill contribution",
      trend: "+5% vs last year",
    },
  ]

  const skillGrowthData = useMemo(() => {
    if (activeResumeSkills.length === 0) return []

    // Calculate your growth (same for all benchmarks)
    const avgProficiency =
      activeResumeSkills.reduce((sum, s) => sum + (Number(s.proficiency) || 0) * 20, 0) / activeResumeSkills.length

    // Calculate industry average from market demand data
    const avgMarketDemand =
      activeResumeSkills.reduce((sum, s) => sum + (marketDemandData[s.name] || s.marketDemand || 50), 0) / activeResumeSkills.length

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

    return months.map((month, idx) => {
      // Your growth: 2% monthly improvement from current proficiency
      const growthMultiplier = 1 + (idx * 0.02)
      const yourGrowth = Math.round(Math.min(100, avgProficiency * growthMultiplier))

      // Calculate benchmark comparison based on selection
      let benchmarkValue = 0

      switch (selectedBenchmark) {
        case "industry-average":
          // Industry average: based on market demand average
          benchmarkValue = Math.round(Math.min(100, avgMarketDemand * 0.85))
          break

        case "senior":
          // Senior level: higher baseline (4-5 proficiency equivalent)
          benchmarkValue = Math.round(Math.min(100, 85 + idx * 0.5))
          break

        case "expert":
          // Expert level: highest baseline (5 proficiency equivalent)
          benchmarkValue = Math.round(Math.min(100, 95 + idx * 0.3))
          break

        case "your-category":
          // Your category average: based on skills in your primary category
          const primaryCategory = activeResumeSkills[0]?.category || "Programming Languages"
          const categorySkills = activeResumeSkills.filter((s) => s.category === primaryCategory)
          const categoryAvgDemand =
            categorySkills.length > 0
              ? categorySkills.reduce((sum, s) => sum + (marketDemandData[s.name] || s.marketDemand || 50), 0) /
                categorySkills.length
              : avgMarketDemand
          benchmarkValue = Math.round(Math.min(100, categoryAvgDemand * 0.85))
          break

        case "top10":
          // Top 10% performers: significantly higher
          benchmarkValue = Math.round(Math.min(100, 92 + idx * 0.8))
          break

        case "senior-backend":
          // Senior Backend Engineer: high demand for backend skills
          benchmarkValue = Math.round(Math.min(100, 88 + idx * 0.6))
          break

        case "mid-data-scientist":
          // Mid-Level Data Scientist: balanced growth
          benchmarkValue = Math.round(Math.min(100, 82 + idx * 0.4))
          break

        case "full-stack":
          // Full-Stack Developer: broad skill baseline
          benchmarkValue = Math.round(Math.min(100, 80 + idx * 0.5))
          break

        default:
          benchmarkValue = Math.round(Math.min(100, avgMarketDemand * 0.85))
      }

      return {
        month,
        you: yourGrowth,
        benchmark: benchmarkValue,
      }
    })
  }, [activeResumeSkills, marketDemandData, selectedBenchmark])

  // Helper function to get benchmark label
  const getBenchmarkLabel = () => {
    switch (selectedBenchmark) {
      case "industry-average":
        return "Industry Average"
      case "senior":
        return "Senior Level"
      case "expert":
        return "Expert Level"
      case "your-category":
        return "Your Category Average"
      case "top10":
        return "Top 10% Performers"
      case "senior-backend":
        return "Senior Backend Engineer"
      case "mid-data-scientist":
        return "Mid-Level Data Scientist"
      case "full-stack":
        return "Full-Stack Developer"
      default:
        return "Industry Average"
    }
  }

  const handleChartReset = () => {
    setZoomLevel(1)
  }

  const handleChartExport = (chartName: string) => {
    if (chartName === "earning-potential" && analyticsData.topSkillsBySalary.length > 0) {
      // Convert salary data to CSV
      const csv = [
        ['Skill', 'Salary Contribution (₹)', 'Market Demand', 'Proficiency'],
        ...analyticsData.topSkillsBySalary.map(s => [
          s.skill,
          s.impact.toLocaleString('en-IN'),
          s.demand || 'N/A',
          (s.proficiency || 0).toFixed(1)
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      
      // Add summary
      const totalSalary = analyticsData.topSkillsBySalary.reduce((sum, skill) => sum + skill.impact, 0)
      const summary = `\n\nTotal Salary Potential: ₹${totalSalary.toLocaleString('en-IN')}`
      const finalCsv = csv + summary
      
      // Create and download blob
      const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `earning-potential-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`✅ Exported earning potential data: ${chartName}`)
    } else if (chartName === "market-demand") {
      // Export top 50 skills by market demand
      const topSkillsForExport = activeResumeSkills
        .sort((a, b) => {
          const demandA = marketDemandData[a.name] || a.marketDemand || 0
          const demandB = marketDemandData[b.name] || b.marketDemand || 0
          return demandB - demandA
        })
        .slice(0, 50)
      
      const csv = [
        ['Skill', 'Market Demand', 'Proficiency', 'Category'],
        ...topSkillsForExport.map(s => {
          const demand = marketDemandData[s.name] || s.marketDemand || 'N/A'
          return [
            s.name,
            demand,
            (Number(s.proficiency) || 0).toFixed(1),
            s.category || 'Uncategorized'
          ]
        })
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `market-demand-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`✅ Exported market demand data: ${chartName}`)
    }
  }

  // Debounced handler for growth chart updates
  const handleGrowthToggle = (toggle: 'growth' | 'industry') => {
    if (isUpdatingChart) return // Prevent rapid clicks
    setIsUpdatingChart(true)
    
    if (toggle === 'growth') {
      setShowYourGrowth(!showYourGrowth)
    } else {
      setShowIndustryAvg(!showIndustryAvg)
    }
    
    setTimeout(() => setIsUpdatingChart(false), 300) // Debounce
  }

  // Debounced handler for benchmark changes
  const handleBenchmarkChange = (benchmark: string) => {
    if (isUpdatingChart) return // Prevent rapid clicks
    setIsUpdatingChart(true)
    setSelectedBenchmark(benchmark)
    setTimeout(() => setIsUpdatingChart(false), 300) // Debounce
  }

  // Fetch trend data when skill accordion is opened
  const handleSkillAccordionChange = async (skillName: string) => {
    // Check if already cached
    if (trendDataCache.has(skillName)) {
      return
    }
    
    try {
      console.log(`📊 Fetching trend data for ${skillName}...`)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trends/${encodeURIComponent(skillName)}?months=12`
      )
      
      if (!response.ok) {
        console.warn(`❌ No trend data available for ${skillName}`)
        return
      }
      
      const data = await response.json()
      console.log(`✅ Loaded trend data for ${skillName}: ${data.history?.length || 0} months`)
      
      // Cache it
      setTrendDataCache(prev => new Map(prev).set(skillName, data))
    } catch (error) {
      console.error(`❌ Error fetching trend for ${skillName}:`, error)
    }
  }

  // Reset radar chart to top 6 skills by market demand
  const handleRadarReset = () => {
    const top6 = activeResumeSkills
      .sort((a, b) => (marketDemandData[b.name] || b.marketDemand || 0) - (marketDemandData[a.name] || a.marketDemand || 0))
      .slice(0, 6)
      .map((s) => s.name)
    setSelectedSkills(top6)
  }

  const radarData = selectedSkills
    .map((skillName) => {
      const skill = activeResumeSkills.find((s) => s.name === skillName)
      if (!skill) return null
      const proficiency = (Number(skill.proficiency) || 0) * 20
      
      // Use real market demand from API or fallback
      const marketDemand = marketDemandData[skillName] || skill.marketDemand || 50

      return {
        skill: skillName,
        "Your Proficiency": proficiency,
        "Market Average": Math.max(0, marketDemand - 15),
        "Top Performers": Math.min(100, proficiency + 15),
      }
    })
    .filter((item) => item !== null)

  // Enhanced loading state - SIMPLIFIED to single condition
  if (showLoadingDialog || !allDataReady) {
    return (
      <>
        {/* Loading dialog overlay - single source of truth */}
        <LoadingDialog 
          isOpen={showLoadingDialog}
          title="Analyzing Your Skills"
          message="Fetching market data and calculating insights..."
          onComplete={() => {
            console.log('✅ [Analytics] Dialog onComplete - data is ready')
            setShowLoadingDialog(false)
          }}
        />
      </>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Analytics & Insights</h1>
            <p className="text-lg text-muted-foreground">Comprehensive analysis of your skills and market positioning</p>
          </div>
          <Button onClick={handleRefreshData} variant="outline" size="sm" disabled={isLoadingMarket}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingMarket ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <ActiveResumeIndicator />

      <Alert className="bg-linear-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <AlertDescription className="ml-3 text-foreground/90 leading-relaxed">{aiExecutiveSummary}</AlertDescription>
      </Alert>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-min">
          {salaryMetrics.map((metric) => (
            <Card key={metric.label} className="glass p-6 space-y-3 shrink-0 min-w-[250px]">
              <div className="space-y-1">
                <p className="text-sm text-foreground/70">{metric.label}</p>
                <p className="text-3xl font-bold text-green-500">{metric.value}</p>
                <p className="text-xs text-foreground/60">{metric.subtext}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                {metric.trend}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Market Demand for Critical Gaps</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleChartExport("market-demand")} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleChartReset} className="gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
        <div style={{ minWidth: '300px', minHeight: '400px' }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analyticsData.criticalGapSkills}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="skill" stroke="rgba(255,255,255,0.7)" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip content={<CustomMarketDemandTooltip />} cursor={{ fill: "rgba(255,255,255,0.1)" }} />
              <Bar dataKey="demand" fill="var(--color-primary)" radius={[8, 8, 0, 0]}>
                {analyticsData.criticalGapSkills.map((entry, index) => {
                  let color = "#3B82F6"
                  if (entry.demand >= 80) color = "#3B82F6"
                  else if (entry.demand >= 50) color = "#8B5CF6"
                  else color = "#EF4444"
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Skills Driving Your Earning Potential</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChartExport("earning-potential")}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
        <div style={{ minWidth: '300px', minHeight: '400px' }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={analyticsData.topSkillsBySalary}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.7)" />
              <YAxis dataKey="skill" type="category" stroke="rgba(255,255,255,0.7)" width={140} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: "8px 12px",
                }}
                formatter={(value) => `₹${(Number(value) / 100000).toFixed(1)}L`}
                itemStyle={{ color: "#1f2937", fontWeight: 500 }}
                labelStyle={{ color: "#374151", fontWeight: 600 }}
                cursor={{ fill: "rgba(255,255,255,0.1)" }}
              />
              <Bar dataKey="impact" radius={[0, 8, 8, 0]}>
                {analyticsData.topSkillsBySalary.map((entry, index) => {
                  // Gradient color palette: Purple to Pink transition
                  const earningPotentialColors = [
                    '#8B5CF6', // Vibrant Purple
                    '#7C3AED', // Deep Purple
                    '#6D28D9', // Rich Purple
                    '#5B21B6', // Dark Purple
                    '#4C1D95', // Very Dark Purple
                    '#EC4899', // Hot Pink
                    '#DB2777', // Deep Pink
                    '#BE185D', // Rich Pink
                    '#9D174D', // Dark Pink
                    '#831843', // Very Dark Pink
                    '#BE123C', // Rose Red
                    '#9F1239', // Deep Rose
                  ]
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={earningPotentialColors[index % earningPotentialColors.length]} 
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Skills Trend Chart with Real Data */}
      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Skills Trend Analysis (Real Data)</h2>
          <div className="flex gap-2">
            {isLoadingTrends ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <Badge variant="outline" className="text-xs">
                Live API Data
              </Badge>
            )}
          </div>
        </div>
        {isLoadingTrends ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading trend data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendChartData}>
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
              {top8TrendSkills.map((skillName, index) => {
                const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#06B6D4", "#F97316", "#EF4444"]
                return (
                  <Line
                    key={skillName}
                    type="monotone"
                    dataKey={skillName}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="glass p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Peer Benchmark Radar Chart</h2>
            <Button variant="outline" size="sm" onClick={handleRadarReset} className="gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {analyticsData.allSkillsData.slice(0, 12).map((skill) => (
              <Badge
                key={skill.skill}
                variant={selectedSkills.includes(skill.skill) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  if (selectedSkills.includes(skill.skill)) {
                    setSelectedSkills(selectedSkills.filter((s) => s !== skill.skill))
                  } else if (selectedSkills.length < 6) {
                    setSelectedSkills([...selectedSkills, skill.skill])
                  }
                }}
              >
                {skill.skill}
              </Badge>
            ))}
          </div>
        </div>
        <div style={{ minWidth: '300px', minHeight: '400px' }}>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="skill" stroke="rgba(255,255,255,0.7)" />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.7)" />
              <Radar
                name="Your Proficiency"
                dataKey="Your Proficiency"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.3}
              />
              <Radar
                name="Market Average"
                dataKey="Market Average"
                stroke="rgba(255,255,255,0.3)"
                fill="rgba(255,255,255,0.1)"
                fillOpacity={0.1}
              />
              <Radar
                name="Top Performers"
                dataKey="Top Performers"
                stroke="rgba(250,204,21,0.5)"
                fill="rgba(250,204,21,0.1)"
                fillOpacity={0.1}
              />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass p-6">
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Growth vs Industry Average</h2>
            <div className="flex gap-2">
              <Button
                variant={showYourGrowth ? "default" : "outline"}
                size="sm"
                onClick={() => handleGrowthToggle('growth')}
                disabled={isUpdatingChart}
              >
                Your Growth
              </Button>
              <Button
                variant={showIndustryAvg ? "default" : "outline"}
                size="sm"
                onClick={() => handleGrowthToggle('industry')}
                disabled={isUpdatingChart}
              >
                Industry Avg
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Benchmark Against:</label>
            <Select value={selectedBenchmark} onValueChange={handleBenchmarkChange} disabled={isUpdatingChart}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="industry-average">Industry Average (All Tech)</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
                <SelectItem value="expert">Expert Level</SelectItem>
                <SelectItem value="your-category">Your Category Average</SelectItem>
                <SelectItem value="top10">Top 10% Performers</SelectItem>
                <SelectItem value="senior-backend">Senior Backend Engineer</SelectItem>
                <SelectItem value="mid-data-scientist">Mid-Level Data Scientist</SelectItem>
                <SelectItem value="full-stack">Full-Stack Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div style={{ minWidth: '300px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={skillGrowthData}>
              <defs>
                <linearGradient id="colorYourGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                }}
                cursor={{ fill: "rgba(255,255,255,0.1)" }}
              />
              <Legend />
              {showYourGrowth && (
                <Area
                  type="monotone"
                  dataKey="you"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fill="url(#colorYourGrowth)"
                  fillOpacity={1}
                  name="Your Skill Growth"
                  dot={{ r: 4, fill: "var(--color-primary)" }}
                />
              )}
              {showIndustryAvg && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="rgba(16, 185, 129, 0.8)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "rgba(16, 185, 129, 0.8)" }}
                  name={getBenchmarkLabel()}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <Alert className="mt-4 bg-blue-500/10 border-blue-500/30">
          <Lightbulb className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-foreground/80 ml-2">
            Your skill growth is being compared against{" "}
            <span className="font-semibold">{getBenchmarkLabel()}</span>. Adjust the benchmark to see how you stack up against different career levels and specializations.
          </AlertDescription>
        </Alert>
      </Card>

      <Card className="glass p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Skill Trends & Future Outlook</h2>
        <ScrollArea className="h-[600px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {analyticsData.allSkillsData.slice(0, 50).map((item, idx) => (
              <AccordionItem key={idx} value={`skill-${idx}`}>
                <AccordionTrigger 
                  className="text-foreground hover:text-foreground/80"
                  onClick={() => handleSkillAccordionChange(item.skill)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.growthRate.startsWith("+") ? (
                      <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="font-medium">{item.skill}</span>
                    <Badge variant="outline" className="ml-2">
                      {item.growthRate}
                    </Badge>
                    <span className="text-sm text-foreground/60 ml-auto">
                      {item.historicalData.length > 0 ? `${item.historicalData[item.historicalData.length - 1].score}/100` : "—"}
                    </span>
                    {trendDataCache.has(item.skill) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Live Data
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Mini Area Chart */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Trend Over Time</h3>
                        {(() => {
                          const trendData = trendDataCache.get(item.skill)
                          
                          if (!trendData?.history || trendData.history.length === 0) {
                            // Use synthetic fallback if no real data
                            return (
                              <div style={{ minWidth: '200px', minHeight: '120px' }}>
                                <ResponsiveContainer width="100%" height={120}>
                                  <AreaChart data={item.historicalData}>
                                    <defs>
                                      <linearGradient id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "rgba(0,0,0,0.8)",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="score"
                                      stroke="var(--color-primary)"
                                      fillOpacity={1}
                                      fill={`url(#gradient-${idx})`}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )
                          }
                          
                          // Use real API data
                          const chartData = trendData.history.map((point: any) => {
                            const monthDate = new Date(point.month)
                            return {
                              month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                              score: Math.round(point.demand_score)
                            }
                          })
                          
                          return (
                            <div style={{ minWidth: '200px', minHeight: '120px' }}>
                              <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "10px" }} />
                                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "rgba(0,0,0,0.8)",
                                      border: "1px solid rgba(255,255,255,0.2)",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="var(--color-primary)"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    name="Demand Score"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Historical Data Grid */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Historical Data</h3>
                        {item.historicalData.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {item.historicalData.map((data) => (
                              <div key={data.year} className="p-2 bg-white/5 rounded text-center">
                                <p className="text-xs text-foreground/60">{data.year}</p>
                                <p className="text-sm font-semibold text-foreground">{data.score}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white/5 rounded text-center text-sm text-foreground/60">
                            No historical data available. Expand to fetch from API.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Forecast */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">Market Forecast</h3>
                      <Alert className="bg-purple-500/10 border-purple-500/30">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <AlertDescription className="text-foreground/80 ml-2 text-sm">
                          {item.futureOutlook}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </Card>

      <Card className="glass p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Skill Category Distribution</h2>

        {analyticsData.skillCategoryData && analyticsData.skillCategoryData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Chart Section - Takes up 2/3 of the space */}
            <div className="lg:col-span-2 h-[300px]" style={{ minWidth: '300px', minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.skillCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {analyticsData.skillCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      padding: "8px 12px",
                    }}
                    itemStyle={{ color: "#1f2937", fontWeight: 500 }}
                    labelStyle={{ color: "#374151", fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Data List/Legend Section - Takes up 1/3 of the space */}
            <div className="lg:col-span-1">
              <ScrollArea className="h-[280px]">
                <div className="space-y-3 pr-4">
                  {analyticsData.skillCategoryData
                    .sort((a, b) => b.value - a.value)
                    .map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                          <span className="text-foreground/80">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          // Fallback UI if no category data is available
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Not enough skill data to generate category distribution.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

const CustomMarketDemandTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 space-y-2">
        <p className="font-semibold text-white">{data.skill}</p>
        <p className="text-sm text-blue-300">Demand Score: {data.demand}/100</p>
        <p className="text-sm text-yellow-300">Trend: {data.trend}</p>
        <p className="text-sm text-green-300">Postings: {data.postings}</p>
        <p className="text-sm text-purple-300">{data.recommendation}</p>
      </div>
    )
  }
  return null
}

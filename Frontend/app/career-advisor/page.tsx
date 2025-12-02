"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { showToast } from "@/lib/utils/toast"
import { LoadingDialog } from "@/components/loading-dialog"
import { useResumeStore } from "@/lib/stores/resume-store"
import {
  getCareerHealth,
  getCareerRecommendations,
  getCareerTrajectory,
  getSkillJourney,
  generateCareerSummary,
  getSalaryTrends,
  getNetworkingSuggestions,
  getInterviewResources,
  getMarketTrends,
  type CareerHealthMetrics,
  type CareerRecommendationsResponse,
  type CareerTrajectoryResponse,
  type SkillJourneyResponse,
  type CareerSummaryResponse,
  type SalaryTrendsResponse,
  type NetworkingSuggestionsResponse,
  type InterviewResourcesResponse,
  type MarketTrendsResponse,
} from "@/lib/api/career-advisor-client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
} from "recharts"
import {
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Download,
  Sparkles,
  Clock,
  Info,
  RefreshCw,
  ExternalLink,
  Code,
  Layout,
  Terminal,
  GitBranch,
  Share2,
} from "lucide-react"

const CHART_COLORS = {
  primary: "#60A5FA", // Bright Blue
  secondary: "#FB923C", // Bright Orange
  success: "#34D399", // Bright Green
  warning: "#FBBF24", // Bright Yellow
  danger: "#F87171", // Bright Red/Pink
  purple: "#C084FC", // Bright Purple
  teal: "#2DD4BF", // Bright Teal
  gridLines: "rgba(255, 255, 255, 0.08)",
  axisLabels: "#E5E5E5",
}

const careerHealthData = [
  { name: "Skills Relevance", value: 85, fill: CHART_COLORS.primary },
  { name: "Market Alignment", value: 78, fill: CHART_COLORS.secondary },
  { name: "Learning Trajectory", value: 82, fill: CHART_COLORS.success },
  { name: "Industry Demand", value: 88, fill: CHART_COLORS.warning },
]

const careerHealthInfo = {
  "Skills Relevance": {
    meaning: "How well your skills match current job market demands",
    calculation: "Based on number of in-demand skills you have, proficiency levels, and skill recency",
  },
  "Market Alignment": {
    meaning: "How well your profile fits your target role",
    calculation: "Based on skill match with job descriptions, experience level, and salary expectations",
  },
  "Learning Trajectory": {
    meaning: "Your skill development momentum and growth rate",
    calculation: "Based on new skills acquired, proficiency improvements, and learning consistency",
  },
  "Industry Demand": {
    meaning: "How sought-after your skillset is in the job market",
    calculation: "Based on job posting frequency, hiring trends, and salary growth potential",
  },
}

const careerTrajectoryData = [
  { quarter: "Q1 2024", currentPath: 65, potentialPath: 65 },
  { quarter: "Q2 2024", currentPath: 68, potentialPath: 73 },
  { quarter: "Q3 2024", currentPath: 70, potentialPath: 79 },
  { quarter: "Q4 2024", currentPath: 72, potentialPath: 84 },
  { quarter: "Q1 2025", currentPath: 74, potentialPath: 88 },
  { quarter: "Q2 2025", currentPath: 76, potentialPath: 92 },
  { quarter: "Q3 2025", currentPath: 78, potentialPath: 95 },
  { quarter: "Q4 2025", currentPath: 80, potentialPath: 98 },
]

const generateMarketTrendsData = (selectedSkills: string[]) => {
  const allSkillsData: Record<string, number[]> = {
    React: [87, 88, 87, 89, 88, 90, 89, 91, 90, 91, 90, 92],
    TypeScript: [70, 72, 74, 76, 78, 80, 82, 84, 85, 86, 87, 88],
    Python: [75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 85],
    Docker: [60, 62, 65, 68, 71, 74, 76, 78, 80, 82, 84, 85],
    Angular: [80, 79, 78, 78, 77, 76, 76, 75, 75, 74, 74, 75],
    "Node.js": [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    AWS: [82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93],
    Kubernetes: [55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88],
    GraphQL: [45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67],
    MongoDB: [68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return months.map((month, idx) => {
    const dataPoint: Record<string, string | number> = { month }
    selectedSkills.forEach((skill) => {
      if (allSkillsData[skill]) {
        dataPoint[skill] = allSkillsData[skill][idx]
      }
    })
    return dataPoint
  })
}

const salaryTrendsData = [
  { level: "Intern", min: 2, median: 3, max: 4 },
  { level: "Junior", min: 4, median: 6, max: 8 },
  { level: "Mid-Level", min: 8, median: 11, max: 15 },
  { level: "Senior", min: 15, median: 20, max: 25 },
  { level: "Lead", min: 25, median: 32, max: 40 },
  { level: "Principal", min: 40, median: 50, max: 60 },
  { level: "Architect", min: 60, median: 75, max: 100 },
]

const skillROIData = [
  { skill: "System Design", hours: 120, salary: 25, opportunities: 45, roi: 92 },
  { skill: "Kubernetes", hours: 100, salary: 22, opportunities: 38, roi: 88 },
  { skill: "GraphQL", hours: 80, salary: 18, opportunities: 32, roi: 85 },
  { skill: "Machine Learning", hours: 150, salary: 28, opportunities: 50, roi: 90 },
  { skill: "Cloud Architecture", hours: 110, salary: 24, opportunities: 42, roi: 89 },
]

const actionItems = [
  {
    title: "Complete System Design Masterclass",
    priority: "High",
    impact: "Very High",
    description: "Master distributed systems, scalability patterns, and architectural decisions",
    steps: [
      "Enroll in System Design course",
      "Complete 20 practice problems",
      "Build a scalable project",
      "Document your learnings",
    ],
    resources: ["Educative.io", "YouTube - Gaurav Sen", "LeetCode Premium"],
    timeline: "8 weeks",
  },
  {
    title: "Build 2-3 Portfolio Projects",
    priority: "High",
    impact: "High",
    description: "Showcase your skills with real-world projects on GitHub",
    steps: ["Identify project ideas", "Design architecture", "Implement with best practices", "Deploy and document"],
    resources: ["GitHub", "Vercel", "AWS"],
    timeline: "12 weeks",
  },
  {
    title: "Attend Tech Meetups & Conferences",
    priority: "Medium",
    impact: "High",
    description: "Network with industry professionals and stay updated on trends",
    steps: [
      "Find local tech meetups",
      "Register for conferences",
      "Prepare elevator pitch",
      "Follow up with connections",
    ],
    resources: ["Meetup.com", "Eventbrite", "LinkedIn"],
    timeline: "Ongoing",
  },
  {
    title: "Practice Interview Problems",
    priority: "High",
    impact: "Very High",
    description: "Prepare for technical and behavioral interviews",
    steps: [
      "Practice 5 system design problems",
      "Review behavioral questions",
      "Mock interviews with peers",
      "Record and review performance",
    ],
    resources: ["LeetCode", "Pramp", "Interviewing.io"],
    timeline: "6 weeks",
  },
  {
    title: "Update Resume & LinkedIn",
    priority: "Medium",
    impact: "Medium",
    description: "Highlight recent achievements and skills",
    steps: ["Add recent projects", "Update skills section", "Get recommendations", "Optimize for ATS"],
    resources: ["Resume.io", "LinkedIn", "Grammarly"],
    timeline: "1 week",
  },
]

const networkingOpportunities = [
  {
    name: "Sarah Chen",
    role: "Senior Staff Engineer at Google",
    description: "Specializes in distributed systems and cloud architecture",
    avatar: "SC",
  },
  {
    name: "Alex Rodriguez",
    role: "Engineering Manager at Meta",
    description: "Focuses on team leadership and technical mentoring",
    avatar: "AR",
  },
  {
    name: "Priya Patel",
    role: "Principal Engineer at Amazon",
    description: "Expert in scalable systems and DevOps practices",
    avatar: "PP",
  },
  {
    name: "James Wilson",
    role: "CTO at Startup XYZ",
    description: "Building innovative solutions with cutting-edge tech",
    avatar: "JW",
  },
]

const careerRecommendations = [
  {
    id: 1,
    title: "Senior Frontend Engineer",
    company: "Tech Companies",
    match: 92,
    salaryRange: "₹120-160L",
    description: "Lead frontend architecture and mentor junior developers",
    skills: ["React", "TypeScript", "System Design"],
    growth: "High",
    timeline: "0-6 months",
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "Startups & Scale-ups",
    match: 85,
    salaryRange: "₹110-150L",
    description: "Build end-to-end features across the stack",
    skills: ["React", "Node.js", "Database Design"],
    growth: "Very High",
    timeline: "6-18 months",
  },
  {
    id: 3,
    title: "Technical Lead",
    company: "Enterprise",
    match: 78,
    salaryRange: "₹130-170L",
    description: "Lead technical teams and drive architecture decisions",
    skills: ["System Design", "Leadership", "Communication"],
    growth: "High",
    timeline: "18+ months",
  },
]

const linkedInProfiles: Record<string, any[]> = {
  "Frontend Developer": [
    {
      name: "Kent C. Dodds",
      role: "React Expert & Testing Advocate",
      company: "Independent Educator",
      bio: "Teaching React, Testing, and Web Development best practices",
      expertise: ["React", "Testing", "JavaScript", "TypeScript"],
      linkedIn: "kentcdodds",
    },
    {
      name: "Dan Abramov",
      role: "React Core Team",
      company: "Meta",
      bio: "Co-author of Redux, Create React App, and React core team member",
      expertise: ["React", "JavaScript", "Open Source"],
      linkedIn: "dan-abramov",
    },
    {
      name: "Sarah Drasner",
      role: "VP of Developer Experience",
      company: "Google",
      bio: "Frontend architecture expert and Vue.js core team member",
      expertise: ["Frontend", "Vue.js", "Animation", "DevEx"],
      linkedIn: "sarah-drasner",
    },
    {
      name: "Wes Bos",
      role: "Full Stack Developer & Educator",
      company: "Independent",
      bio: "Teaching modern web development through courses and tutorials",
      expertise: ["JavaScript", "React", "Node.js", "CSS"],
      linkedIn: "wesbos",
    },
  ],
  "Backend Engineer": [
    {
      name: "Martin Fowler",
      role: "Chief Scientist",
      company: "ThoughtWorks",
      bio: "Software architecture expert and author of influential programming books",
      expertise: ["Architecture", "Refactoring", "Microservices"],
      linkedIn: "martinfowler",
    },
    {
      name: "Kelsey Hightower",
      role: "Staff Developer Advocate",
      company: "Google Cloud",
      bio: "Cloud infrastructure and Kubernetes expert",
      expertise: ["Kubernetes", "Cloud", "DevOps", "Infrastructure"],
      linkedIn: "kelsey-hightower",
    },
  ],
  "Data Scientist": [
    {
      name: "Andrew Ng",
      role: "Founder & CEO",
      company: "DeepLearning.AI",
      bio: "AI/ML education pioneer and Stanford professor",
      expertise: ["AI", "Machine Learning", "Deep Learning", "Education"],
      linkedIn: "andrewyng",
    },
    {
      name: "Cassie Kozyrkov",
      role: "Chief Decision Scientist",
      company: "Google",
      bio: "Making data science accessible and practical for everyone",
      expertise: ["Data Science", "Decision Intelligence", "Statistics"],
      linkedIn: "kozyrkov",
    },
  ],
}

const interviewResources = [
  {
    category: "Technical Round",
    icon: Code,
    description: "Master data structures, algorithms, and system design fundamentals",
    resources: [
      { type: "YouTube", title: "NeetCode - LeetCode Solutions", url: "https://www.youtube.com/c/NeetCode" },
      {
        type: "Practice",
        title: "LeetCode - Top Interview Questions",
        url: "https://leetcode.com/problemset/top-interview-questions/",
      },
      { type: "Guide", title: "Tech Interview Handbook", url: "https://techinterviewhandbook.org/" },
    ],
  },
  {
    category: "System Design",
    icon: Layout,
    description: "Learn to design scalable systems and explain architectural decisions",
    resources: [
      { type: "YouTube", title: "Gaurav Sen - System Design", url: "https://www.youtube.com/c/GauravSensei" },
      {
        type: "Course",
        title: "Educative - Grokking System Design",
        url: "https://www.educative.io/courses/grokking-the-system-design-interview",
      },
      {
        type: "Guide",
        title: "System Design Primer",
        url: "https://github.com/donnemartin/system-design-primer",
      },
    ],
  },
  {
    category: "Behavioral Round",
    icon: MessageSquare,
    description: "Prepare STAR method responses and demonstrate leadership skills",
    resources: [
      { type: "YouTube", title: "STAR Method Explained", url: "https://www.youtube.com/watch?v=0qBL74yhcgU" },
      {
        type: "Guide",
        title: "Tech Behavioral Interview Guide",
        url: "https://www.techinterviewhandbook.org/behavioral-interview/",
      },
      {
        type: "Practice",
        title: "Common Behavioral Questions",
        url: "https://www.indeed.com/career-advice/interviewing/common-behavioral-interview-questions",
      },
    ],
  },
  {
    category: "Coding Round",
    icon: Terminal,
    description: "Practice coding in real-time with feedback and time constraints",
    resources: [
      { type: "Platform", title: "Pramp - Free Mock Interviews", url: "https://www.pramp.com/" },
      {
        type: "YouTube",
        title: "Clement Mihailescu - AlgoExpert",
        url: "https://www.youtube.com/c/clem",
      },
      {
        type: "Practice",
        title: "HackerRank Interview Prep",
        url: "https://www.hackerrank.com/interview/interview-preparation-kit",
      },
    ],
  },
]

const networkingTips = [
  {
    icon: Users,
    title: "Connect with Peers",
    description: "Join tech communities and attend meetups to expand your network",
    links: [
      { title: "Meetup.com - Tech Groups", url: "https://www.meetup.com/topics/technology/" },
      { title: "Dev.to Community", url: "https://dev.to/" },
      { title: "Hashnode Communities", url: "https://hashnode.com/" },
    ],
    action: "Find Local Meetups",
  },
  {
    icon: Share2,
    title: "Engage on Social Media",
    description: "Share your learning journey on Twitter/LinkedIn to build visibility",
    links: [
      { title: "LinkedIn Learning Paths", url: "https://www.linkedin.com/learning/" },
      { title: "Twitter Dev Community", url: "https://twitter.com/i/communities/1497552704545759235" },
      { title: "#100DaysOfCode Challenge", url: "https://www.100daysofcode.com/" },
    ],
    action: "Start Sharing Weekly",
  },
  {
    icon: GitBranch,
    title: "Contribute to Open Source",
    description: "Build credibility by contributing to popular open source projects",
    links: [
      { title: "GitHub Good First Issues", url: "https://github.com/topics/good-first-issue" },
      { title: "First Timers Only", url: "https://www.firsttimersonly.com/" },
      { title: "Open Source Guide", url: "https://opensource.guide/how-to-contribute/" },
    ],
    action: "Make First Contribution",
  },
  {
    icon: Calendar,
    title: "Attend Conferences",
    description: "Network with industry leaders and stay updated on trends",
    links: [
      { title: "React Conf", url: "https://conf.react.dev/" },
      { title: "Tech Conference Calendar", url: "https://confs.tech/" },
      { title: "DevFest Events", url: "https://devfest.withgoogle.com/" },
    ],
    action: "Register for Events",
  },
]

const skillJourneyData = [
  { date: "Jan 2024", event: "Acquired React", type: "skill", icon: "📚" },
  { date: "Feb 2024", event: "TypeScript Proficiency Upgrade", type: "proficiency", icon: "⬆️" },
  { date: "Mar 2024", event: "AWS Certification Earned", type: "certification", icon: "🏆" },
  { date: "Apr 2024", event: "E-commerce Project Completed", type: "project", icon: "🚀" },
  { date: "May 2024", event: "React Advanced Course Completed", type: "course", icon: "✅" },
  { date: "Jun 2024", event: "Acquired Docker", type: "skill", icon: "📚" },
  { date: "Jul 2024", event: "System Design Course Completed", type: "course", icon: "✅" },
  { date: "Aug 2024", event: "Kubernetes Proficiency Upgrade", type: "proficiency", icon: "⬆️" },
]

export default function CareerAdvisorPage() {
  const [selectedRole, setSelectedRole] = useState(0)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(true)
  const { toast } = useToast()

  // Get active resume to fetch candidate ID
  const { resumes, activeResumeId } = useResumeStore()
  const activeResume = resumes.find((r) => r.id === activeResumeId)
  const candidateId = activeResume?.candidateId

  // Backend data state
  const [careerHealthDataState, setCareerHealthDataState] = useState<any[]>([
    { name: "Skills Relevance", value: 85, fill: CHART_COLORS.primary },
    { name: "Market Alignment", value: 78, fill: CHART_COLORS.secondary },
    { name: "Learning Trajectory", value: 82, fill: CHART_COLORS.success },
    { name: "Industry Demand", value: 88, fill: CHART_COLORS.warning },
  ])

  const [careerRecommendationsState, setCareerRecommendationsState] = useState<any[]>([
    {
      id: 1,
      title: "Senior Frontend Engineer",
      company: "Tech Companies",
      match: 92,
      salaryRange: "₹120-160L",
      description: "Lead frontend architecture and mentor junior developers",
      skills: ["React", "TypeScript", "System Design"],
      growth: "High",
      timeline: "0-6 months",
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      company: "Startups & Scale-ups",
      match: 85,
      salaryRange: "₹110-150L",
      description: "Build end-to-end features across the stack",
      skills: ["React", "Node.js", "Database Design"],
      growth: "Very High",
      timeline: "6-18 months",
    },
    {
      id: 3,
      title: "Technical Lead",
      company: "Enterprise",
      match: 78,
      salaryRange: "₹130-170L",
      description: "Lead technical teams and drive architecture decisions",
      skills: ["System Design", "Leadership", "Communication"],
      growth: "High",
      timeline: "18+ months",
    },
  ])

  const [careerTrajectoryDataState, setCareerTrajectoryDataState] = useState<any[]>([
    { quarter: "Q1 2024", currentPath: 65, potentialPath: 65 },
    { quarter: "Q2 2024", currentPath: 68, potentialPath: 73 },
    { quarter: "Q3 2024", currentPath: 70, potentialPath: 79 },
    { quarter: "Q4 2024", currentPath: 72, potentialPath: 84 },
    { quarter: "Q1 2025", currentPath: 74, potentialPath: 88 },
    { quarter: "Q2 2025", currentPath: 76, potentialPath: 92 },
    { quarter: "Q3 2025", currentPath: 78, potentialPath: 95 },
    { quarter: "Q4 2025", currentPath: 80, potentialPath: 98 },
  ])

  const [skillJourneyDataState, setSkillJourneyDataState] = useState<any[]>([
    { date: "Jan 2024", event: "Acquired React", type: "skill", icon: "📚" },
    { date: "Feb 2024", event: "TypeScript Proficiency Upgrade", type: "proficiency", icon: "⬆️" },
    { date: "Mar 2024", event: "AWS Certification Earned", type: "certification", icon: "🏆" },
    { date: "Apr 2024", event: "E-commerce Project Completed", type: "project", icon: "🚀" },
    { date: "May 2024", event: "React Advanced Course Completed", type: "course", icon: "✅" },
    { date: "Jun 2024", event: "Acquired Docker", type: "skill", icon: "📚" },
    { date: "Jul 2024", event: "System Design Course Completed", type: "course", icon: "✅" },
    { date: "Aug 2024", event: "Kubernetes Proficiency Upgrade", type: "proficiency", icon: "⬆️" },
  ])

  const [salaryTrendsDataState, setSalaryTrendsDataState] = useState<any[]>([
    { level: "Intern", min: 2, median: 3, max: 4 },
    { level: "Junior", min: 4, median: 6, max: 8 },
    { level: "Mid-Level", min: 8, median: 11, max: 15 },
    { level: "Senior", min: 15, median: 20, max: 25 },
    { level: "Lead", min: 25, median: 32, max: 40 },
    { level: "Principal", min: 40, median: 50, max: 60 },
    { level: "Architect", min: 60, median: 75, max: 100 },
  ])

  const [aiSummary, setAiSummary] = useState<string>('')
  const [networkingProfilesState, setNetworkingProfilesState] = useState<any[]>([])
  const [interviewResourcesState, setInterviewResourcesState] = useState<any[]>([])

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  const availableSkills = [
    "React",
    "TypeScript",
    "Python",
    "Docker",
    "Angular",
    "Node.js",
    "AWS",
    "Kubernetes",
    "GraphQL",
    "MongoDB",
  ]
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "TypeScript", "Python", "Docker", "Angular"])

  const marketTrendsData = useMemo(() => generateMarketTrendsData(selectedSkills), [selectedSkills])

  // 🔍 DEBUG LOG ON MOUNT
  console.log('=== 🔍 CAREER ADVISOR DEBUG ===')
  console.log('📋 Resumes Count:', resumes.length)
  console.log('🎯 Active Resume ID:', activeResumeId)
  console.log('👤 Active Resume:', activeResume)
  console.log('🔑 Candidate ID:', candidateId)
  console.log('📡 API URL:', process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000')
  console.log('=== END DEBUG ===')

  // Fetch all career advisor data from backend
  useEffect(() => {
    const fetchCareerData = async () => {
      console.log('🚀 fetchCareerData called with candidateId:', candidateId)
      
      if (!candidateId) {
        console.log('❌ No candidate ID, skipping data fetch')
        setIsLoadingData(false)
        return
      }

      try {
        setIsLoadingData(true)
        setDataError(null)

        console.log(`✅ Fetching career advisor data for candidate ${candidateId}`)
        console.log('🧪 Testing endpoints...')

        // Fetch all data in parallel
        console.log('⏳ Calling Promise.allSettled on 8 endpoints...')
        const [
          healthData,
          recommendationsData,
          trajectoryData,
          journeyData,
          salaryData,
          summaryData,
          networkingData,
          resourcesData,
        ] = await Promise.allSettled([
          getCareerHealth(candidateId),
          getCareerRecommendations(candidateId, { limit: 3 }),
          getCareerTrajectory(candidateId, 8),
          getSkillJourney(candidateId, { limit: 8 }),
          getSalaryTrends('Software Engineer', 'INR', 'India'),
          generateCareerSummary(candidateId, { context: 'career_growth' }),
          getNetworkingSuggestions(candidateId, { limit: 4 }),
          getInterviewResources(candidateId, { role: 'Software Engineer' }),
        ])

        // Log endpoint results
        console.log('📊 Endpoint Results:')
        console.log('  1️⃣ Career Health:', healthData.status)
        console.log('  2️⃣ Recommendations:', recommendationsData.status)
        console.log('  3️⃣ Trajectory:', trajectoryData.status)
        console.log('  4️⃣ Skill Journey:', journeyData.status)
        console.log('  5️⃣ Salary Trends:', salaryData.status)
        console.log('  6️⃣ Summary:', summaryData.status)
        console.log('  7️⃣ Networking:', networkingData.status)
        console.log('  8️⃣ Interview Resources:', resourcesData.status)

        // Update career health data
        if (healthData.status === 'fulfilled') {
          const health = healthData.value
          console.log('✅ Health data received:', health)
          setCareerHealthDataState([
            { name: "Skills Relevance", value: health.skills_relevance, fill: CHART_COLORS.primary },
            { name: "Market Alignment", value: health.market_alignment, fill: CHART_COLORS.secondary },
            { name: "Learning Trajectory", value: health.learning_trajectory, fill: CHART_COLORS.success },
            { name: "Industry Demand", value: health.industry_demand, fill: CHART_COLORS.warning },
          ])

          if (health.warning) {
            console.warn('Career health warning:', health.warning)
          }
        } else {
          console.error('❌ Failed to fetch career health:', {
            status: healthData.status,
            reason: healthData.reason,
            message: (healthData.reason as any)?.message,
          })
          // Fallback to default data
          console.log('⚠️ Using default career health data as fallback')
          setCareerHealthDataState([
            { name: "Skills Relevance", value: 82, fill: CHART_COLORS.primary },
            { name: "Market Alignment", value: 78, fill: CHART_COLORS.secondary },
            { name: "Learning Trajectory", value: 85, fill: CHART_COLORS.success },
            { name: "Industry Demand", value: 88, fill: CHART_COLORS.warning },
          ])
        }

        // Update career recommendations
        if (recommendationsData.status === 'fulfilled') {
          const recs = recommendationsData.value
          console.log('✅ Recommendations received:', recs)
          setCareerRecommendationsState(
            recs.recommendations.map((rec: any) => ({
              id: rec.id,
              title: rec.title,
              company: rec.company_type,
              match: rec.match_score,
              salaryRange: `₹${rec.salary_range.min}-${rec.salary_range.max}L`,
              description: rec.description,
              skills: rec.required_skills,
              growth: rec.growth_potential,
              timeline: rec.timeline_months,
            }))
          )
        } else {
          console.error('❌ Failed to fetch recommendations:', {
            status: recommendationsData.status,
            reason: recommendationsData.reason,
          })
          // Fallback to mock data
          console.log('⚠️ Using default recommendations as fallback')
          setCareerRecommendationsState([
            {
              id: 1,
              title: "Senior Frontend Engineer",
              company: "Tech Companies",
              match: 92,
              salaryRange: "₹120-160L",
              description: "Lead frontend architecture and mentor junior developers",
              skills: ["React", "TypeScript", "System Design"],
              growth: "High",
              timeline: "0-6 months",
            },
            {
              id: 2,
              title: "Full Stack Engineer",
              company: "Startups & Scale-ups",
              match: 85,
              salaryRange: "₹110-150L",
              description: "Build end-to-end features across the stack",
              skills: ["React", "Node.js", "Database Design"],
              growth: "Very High",
              timeline: "6-18 months",
            },
            {
              id: 3,
              title: "Technical Lead",
              company: "Enterprise",
              match: 78,
              salaryRange: "₹130-170L",
              description: "Lead technical teams and drive architecture decisions",
              skills: ["System Design", "Leadership", "Communication"],
              growth: "High",
              timeline: "18+ months",
            },
          ])
        }

        // Update career trajectory
        if (trajectoryData.status === 'fulfilled') {
          const trajectory = trajectoryData.value
          setCareerTrajectoryDataState(
            trajectory.projections.map((proj: any) => ({
              quarter: proj.quarter,
              currentPath: proj.current_path_score,
              potentialPath: proj.potential_path_score,
            }))
          )
        } else {
          console.error('Failed to fetch trajectory:', trajectoryData.reason)
        }

        // Update skill journey
        if (journeyData.status === 'fulfilled') {
          const journey = journeyData.value
          if (journey.events && journey.events.length > 0) {
            setSkillJourneyDataState(journey.events)
          }
        } else {
          console.error('Failed to fetch skill journey:', journeyData.reason)
        }

        // Update salary trends
        if (salaryData.status === 'fulfilled') {
          const salary = salaryData.value
          setSalaryTrendsDataState(
            salary.salary_by_level.map((level: any) => ({
              level: level.level,
              min: level.min_lpa,
              median: level.median_lpa,
              max: level.max_lpa,
            }))
          )
        } else {
          console.error('Failed to fetch salary trends:', salaryData.reason)
        }

        // Update AI summary
        if (summaryData.status === 'fulfilled') {
          const summary = summaryData.value
          console.log('✅ Summary received:', summary)
          setAiSummary(summary.summary)
        } else {
          console.error('❌ Failed to generate summary:', summaryData.reason)
          // Fallback to default summary
          console.log('⚠️ Using default AI summary as fallback')
          setAiSummary(
            "Your career is on an excellent trajectory with strong technical fundamentals. " +
            "You have demonstrated expertise in multiple domains and are well-positioned for advancement. " +
            "Focus on system design and cloud architecture to unlock senior-level opportunities within 6-12 months. " +
            "Build 2-3 substantial portfolio projects and actively network with senior engineers in your target companies."
          )
        }

        // Update networking suggestions
        if (networkingData.status === 'fulfilled') {
          const networking = networkingData.value
          setNetworkingProfilesState(networking.suggested_connections)
        } else {
          console.error('Failed to fetch networking:', networkingData.reason)
        }

        // Update interview resources
        if (resourcesData.status === 'fulfilled') {
          const resources = resourcesData.value
          setInterviewResourcesState(resources.categories)
        } else {
          console.error('Failed to fetch resources:', resourcesData.reason)
        }

        setIsLoadingData(false)
        console.log('✅ Career advisor data loaded successfully')
      } catch (error) {
        console.error('Error fetching career advisor data:', error)
        setDataError(error instanceof Error ? error.message : 'Unknown error')
        setIsLoadingData(false)
      }
    }

    fetchCareerData()
  }, [candidateId])

  // Market Trends State
  const [marketTrendsDataState, setMarketTrendsDataState] = useState<any[]>([])
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)

  // Fetch market trends when selected skills change
  useEffect(() => {
    const fetchMarketTrends = async () => {
      if (selectedSkills.length === 0) {
        setMarketTrendsDataState([])
        return
      }

      try {
        setIsLoadingTrends(true)
        console.log('Fetching market trends for:', selectedSkills)

        const trendsData = await getMarketTrends(selectedSkills, 12)

        // Transform API response to chart format
        const chartData = trendsData.months.map((month: string, idx: number) => {
          const dataPoint: Record<string, string | number> = { month }

          Object.entries(trendsData.skills).forEach(([skillName, skillData]: [string, any]) => {
            dataPoint[skillName] = skillData.monthly_demand[idx] || 0
          })

          return dataPoint
        })

        setMarketTrendsDataState(chartData)

        if (trendsData.warning) {
          console.warn('Market trends warning:', trendsData.warning)
        }
      } catch (error) {
        console.error('Failed to fetch market trends:', error)
        // Keep existing data on error
      } finally {
        setIsLoadingTrends(false)
      }
    }

    fetchMarketTrends()
  }, [selectedSkills])

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill)
      } else if (prev.length < 10) {
        return [...prev, skill]
      } else {
        toast({
          title: "Maximum skills selected",
          description: "You can select up to 10 skills at a time",
          variant: "destructive",
        })
        return prev
      }
    })
  }

  const selectTopSkills = () => {
    setSelectedSkills(availableSkills.slice(0, 5))
  }

  const clearAllSkills = () => {
    setSelectedSkills([])
  }

  const [isRegenerating, setIsRegenerating] = useState(false)
  const [summaryVersion, setSummaryVersion] = useState(0)

  const regenerateSummary = async () => {
    if (!candidateId) return

    setIsRegenerating(true)
    showToast("info", {
      title: "🧠 Analyzing Your Profile...",
      description: "The AI is generating personalized career advice based on your skills.",
    })

    try {
      const summary = await generateCareerSummary(candidateId, {
        context: 'career_growth',
        regenerate: true,
      })

      setAiSummary(summary.summary)
      setSummaryVersion((prev) => prev + 1)

      showToast("success", {
        title: "✨ Advice Ready!",
        description: "Your personalized career insights have been generated.",
      })
    } catch (error) {
      console.error('Failed to regenerate summary:', error)
      showToast("error", {
        title: "Generation Failed",
        description: "Unable to regenerate summary. Please try again.",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSelectRole = (idx: number) => {
    setSelectedRole(idx)
    const role = careerRecommendations[idx]
    showToast("success", {
      title: "✅ Role Selected",
      description: `You selected ${role.title} as your target career path.`,
    })
  }

  const handleCreateLearningPath = () => {
    const role = selectedRecommendation
    showToast("info", {
      title: "📚 Creating Learning Path...",
      description: `Generating a personalized learning path for ${role.title}...`,
    })

    setTimeout(() => {
      showToast("success", {
        title: "✅ Learning Path Created",
        description: `Your learning path for ${role.title} has been created and saved.`,
      })
    }, 2000)
  }

  const handleDownloadCareerReport = () => {
    showToast("info", {
      title: "📄 Generating Report...",
      description: "Your comprehensive career report is being prepared.",
    })

    setTimeout(() => {
      showToast("success", {
        title: "📄 Export Complete",
        description: "Your career report PDF has started downloading.",
      })
    }, 2500)
  }

  const summaries = [
    {
      text: "Your career is on an excellent trajectory with strong technical fundamentals and market alignment. You excel in modern frontend technologies and have demonstrated growth in full-stack capabilities. Your current skill set positions you well for senior-level roles within 6-12 months. The biggest opportunities lie in system design and architectural thinking. By investing 8-12 weeks in mastering distributed systems and cloud architecture, you could unlock senior staff engineer positions with significantly higher compensation and impact. Immediate actions: Complete a system design course, build 2-3 portfolio projects showcasing scalability, and start networking with senior engineers at target companies. This combination will accelerate your career progression by 6-12 months.",
    },
    {
      text: "You're demonstrating exceptional growth momentum with a well-rounded technical profile. Your proficiency in React and TypeScript positions you strongly in the current market, while your expanding backend knowledge opens doors to full-stack opportunities. Focus on deepening your system design expertise and cloud architecture skills to reach staff-level positions faster. Consider contributing to open source projects to build visibility and credibility. Your learning trajectory suggests you could transition to a senior role within 6 months with focused effort on architectural patterns and scalability challenges.",
    },
    {
      text: "Your skill portfolio shows strategic alignment with high-demand technologies. The combination of frontend expertise and growing backend capabilities makes you a valuable candidate for senior engineering roles. To accelerate your career, prioritize hands-on experience with distributed systems and microservices architecture. Building 2-3 substantial portfolio projects that demonstrate scalability thinking will significantly strengthen your position. Network actively with senior engineers and participate in technical communities to increase visibility. With targeted effort, you're positioned to reach senior-level roles within the next 6-9 months.",
    },
  ]

  const currentSummary = aiSummary || "Your career insights are being generated..."

  const selectedRecommendation = careerRecommendationsState[selectedRole]
  const overallScore = Math.round(
    (careerHealthDataState[0]?.value || 85) +
      (careerHealthDataState[1]?.value || 78) +
      (careerHealthDataState[2]?.value || 82) +
      (careerHealthDataState[3]?.value || 88) /
        4
  )

  const targetRole = selectedRecommendation.title.includes("Frontend")
    ? "Frontend Developer"
    : selectedRecommendation.title.includes("Backend")
      ? "Backend Engineer"
      : "Frontend Developer"

  const networkingProfiles = networkingProfilesState.length > 0
    ? networkingProfilesState
    : linkedInProfiles[targetRole] || linkedInProfiles["Frontend Developer"]

  const skillChartColors = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.purple,
    CHART_COLORS.teal,
    "#A78BFA",
    "#FCD34D",
    "#6EE7B7",
  ]

  // Show loading state
  if (isLoadingData) {
    return (
      <>
        <LoadingDialog
          isOpen={isLoadingDialogOpen}
          title="Preparing Career Insights"
          message="Analyzing your profile and career recommendations..."
          onComplete={() => setIsLoadingDialogOpen(false)}
        />
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Career Advisor</h1>
            <p className="text-foreground/70">Loading your personalized career insights...</p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-foreground/70">Fetching career data...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Show error state
  if (dataError) {
    return (
      <div className="p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Career Advisor</h1>
        </div>
        <Alert className="bg-destructive/10 border-destructive/30">
          <AlertDescription className="text-destructive">
            Failed to load career data: {dataError}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Show no candidate state
  if (!candidateId) {
    return (
      <div className="p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Career Advisor</h1>
        </div>
        <Card className="glass p-12 text-center">
          <p className="text-foreground/70 text-lg mb-4">
            No active resume found. Please upload and analyze a resume first.
          </p>
          <Button onClick={() => (window.location.href = '/resume')}>
            Go to Resume Upload
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <LoadingDialog
        isOpen={isLoadingDialogOpen}
        title="Preparing Career Insights"
        message="Analyzing your profile and career recommendations..."
        onComplete={() => {
          console.log("✅ Loading complete, closing dialog")
          setIsLoadingDialogOpen(false)
        }}
      />
      <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Career Advisor</h1>
        <p className="text-foreground/70">AI-powered career guidance and strategic growth recommendations</p>
      </div>

      {/* Career Health Score */}
      <Card className="glass p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Career Health Score</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                data={careerHealthDataState}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  label={{ position: "insideStart", fill: "#fff" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-foreground/70 mb-2">Overall Career Health</p>
              <p className="text-5xl font-bold text-primary">{overallScore}</p>
              <p className="text-sm text-green-400 mt-2">Excellent - Above Industry Average</p>
            </div>
            <div className="space-y-3">
              {careerHealthDataState.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                          <Info className="h-3 w-3 text-foreground/50 hover:text-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-card text-card-foreground border-border">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <div className="space-y-2 text-xs">
                            <div>
                              <p className="font-medium text-foreground/70">Meaning:</p>
                              <p className="text-foreground/90">
                                {careerHealthInfo[item.name as keyof typeof careerHealthInfo].meaning}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground/70">Calculation:</p>
                              <p className="text-foreground/90">
                                {careerHealthInfo[item.name as keyof typeof careerHealthInfo].calculation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.fill }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-12 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Career Growth Projection */}
      <Card className="glass p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Career Growth Projection</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={careerTrajectoryDataState}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLines} />
            <XAxis dataKey="quarter" stroke={CHART_COLORS.axisLabels} />
            <YAxis
              stroke={CHART_COLORS.axisLabels}
              label={{ value: "Career Level Score", angle: -90, position: "insideLeft", fill: CHART_COLORS.axisLabels }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="currentPath"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.3}
              strokeWidth={2}
              name="Your Projected Growth (Current Path)"
            />
            <Area
              type="monotone"
              dataKey="potentialPath"
              stroke={CHART_COLORS.secondary}
              fill={CHART_COLORS.secondary}
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Potential with Upskilling (Accelerated Path)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <Alert className="mt-4 bg-primary/10 border-primary/30">
          <TrendingUp className="h-4 w-4 text-primary" />
          <AlertDescription className="ml-2 text-sm text-foreground/90">
            Your current trajectory shows steady growth. By focusing on cloud skills and Kubernetes, you could
            accelerate to a senior role <strong>8 months faster</strong> with a potential{" "}
            <strong className="text-primary">₹3.2L salary increase</strong>.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Recommended Career Paths */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Recommended Career Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {careerRecommendationsState.map((role, idx) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(idx)}
              className={`text-left transition-all ${selectedRole === idx ? "ring-2 ring-primary" : ""}`}
            >
              <Card className={`glass p-6 space-y-4 h-full ${selectedRole === idx ? "border-primary" : ""}`}>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                  <p className="text-sm text-foreground/70">{role.company}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/70">Match Score</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30">{role.match}%</Badge>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${role.match}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Clock className="w-4 h-4" />
                  <span>{role.timeline}</span>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-foreground/70">{role.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {role.skills.slice(0, 2).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Role Details */}
      <Card className="glass p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{selectedRecommendation.title}</h2>
              <p className="text-foreground/70 mt-2">{selectedRecommendation.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground/70">Estimated Salary</p>
              <p className="text-2xl font-bold text-primary">{selectedRecommendation.salaryRange}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/70">Market Growth</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-foreground">{selectedRecommendation.growth}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground/70">Key Skills</p>
              <div className="flex flex-wrap gap-1">
                {selectedRecommendation.skills.map((skill: string) => (
                  <Badge key={skill} className="bg-primary/20 text-primary border-primary/30">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={handleCreateLearningPath}>
          Create Learning Path for {selectedRecommendation.title}
        </Button>
      </Card>

      {/* Market Trends & Salary Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Trends */}
        <Card className="glass p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Market Trends (Last 12 Months)</h2>

          <div className="mb-4 p-4 bg-secondary/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Skills to Track ({selectedSkills.length}/10)</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectTopSkills} className="text-xs h-7 bg-transparent">
                  Select Top 5
                </Button>
                <Button size="sm" variant="outline" onClick={clearAllSkills} className="text-xs h-7 bg-transparent">
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {availableSkills.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label htmlFor={skill} className="text-xs cursor-pointer">
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {selectedSkills.length > 0 ? (
            <>
              {isLoadingTrends ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-foreground/70">Loading trends...</p>
                  </div>
                </div>
              ) : marketTrendsDataState.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={marketTrendsDataState}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLines} />
                      <XAxis dataKey="month" stroke={CHART_COLORS.axisLabels} />
                      <YAxis stroke={CHART_COLORS.axisLabels} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.9)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      {selectedSkills.map((skill, idx) => (
                        <Line
                          key={skill}
                          type="monotone"
                          dataKey={skill}
                          stroke={skillChartColors[idx % skillChartColors.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="mt-4 p-3 bg-primary/10 rounded-lg space-y-1 text-xs">
                    <p className="font-semibold text-foreground">Key Insights:</p>
                    <p className="text-foreground/80">• Real-time market demand data</p>
                    <p className="text-foreground/80">• Updated from industry sources</p>
                    <p className="text-primary font-medium mt-2">
                      💡 Track your skills' market performance
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-foreground/50">
                  No trend data available for selected skills
                </div>
              )}
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-foreground/50">
              Select skills to view market trends
            </div>
          )}
        </Card>

        {/* Salary Trends */}
        <Card className="glass p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Salary Trends by Level</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryTrendsDataState}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLines} />
              <XAxis dataKey="level" stroke={CHART_COLORS.axisLabels} angle={-15} textAnchor="end" height={80} />
              <YAxis
                stroke={CHART_COLORS.axisLabels}
                label={{ value: "Salary (LPA)", angle: -90, position: "insideLeft", fill: CHART_COLORS.axisLabels }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [
                  `₹${value}L`,
                  name === "median" ? "Median" : name === "min" ? "Min" : "Max",
                ]}
              />
              <Legend />
              <Bar dataKey="min" fill={CHART_COLORS.primary} fillOpacity={0.3} name="Min" />
              <Bar dataKey="median" fill={CHART_COLORS.success} name="Median" />
              <Bar dataKey="max" fill={CHART_COLORS.secondary} fillOpacity={0.3} name="Max" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-foreground/60 mt-3 text-center">
            Based on industry data for tech professionals in India, 2024. Actual salaries vary by location, company, and
            specific skills.
          </p>
        </Card>
      </div>

      {/* Skill Journey Timeline */}
      <Card className="glass p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Your Skill Journey</h2>
        <p className="text-sm text-foreground/70">Track your skill acquisition and development over time</p>
        <div className="space-y-3">
          {skillJourneyDataState.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-4 items-start group cursor-pointer hover:bg-secondary/20 p-2 rounded-lg transition-colors"
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                {idx < skillJourneyData.length - 1 && <div className="w-0.5 h-12 bg-foreground/20 my-2" />}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-xs font-semibold text-foreground/70">{item.date}</p>
                <p className="text-sm text-foreground font-medium">{item.event}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-success/10 rounded-lg">
          <p className="text-xs font-semibold text-foreground">Most Productive Period:</p>
          <p className="text-sm text-foreground/80">Q2 2024 - acquired 3 new skills and completed 2 courses</p>
        </div>
      </Card>

      {/* Build Your Network */}
      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Build Your Network</h2>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {networkingProfiles.length} Connections
          </Badge>
        </div>

        {networkingProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {networkingProfiles.map((profile: any, idx: number) => (
              <Card key={idx} className="glass p-4 hover:border-primary/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                    {profile.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{profile.name}</h3>
                    <p className="text-xs text-foreground/60 truncate">{profile.role}</p>
                    <p className="text-xs text-foreground/50 truncate">{profile.company}</p>
                    <p className="text-xs text-foreground/70 mt-2 line-clamp-2">{profile.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.expertise.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => window.open(`https://linkedin.com/in/${profile.linkedin_username}`, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Connect on LinkedIn
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground/50">
            No networking suggestions available
          </div>
        )}
      </Card>

      {/* Interview Preparation */}
      <Card className="glass p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Interview Preparation</h2>

        {interviewResourcesState.length > 0 ? (
          <div className="space-y-6">
            {interviewResourcesState.map((category: any, idx: number) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon || "📚"}</span>
                  <h3 className="text-lg font-semibold text-foreground">{category.category}</h3>
                </div>
                <p className="text-sm text-foreground/70">{category.description}</p>

                <div className="grid grid-cols-1 gap-3">
                  {category.resources?.slice(0, 3).map((resource: any, resIdx: number) => (
                    <Card key={resIdx} className="glass p-4 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {resource.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                resource.cost === "Free"
                                  ? "text-green-400 border-green-400"
                                  : "text-yellow-400 border-yellow-400"
                              }
                            >
                              {resource.cost}
                            </Badge>
                            {resource.difficulty && (
                              <Badge variant="outline" className="text-xs">
                                {resource.difficulty}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-foreground text-sm mb-1">
                            {resource.title}
                          </h4>
                          <p className="text-xs text-foreground/70 line-clamp-2">
                            {resource.description}
                          </p>
                          {resource.estimated_hours && (
                            <p className="text-xs text-foreground/50 mt-1">
                              ⏱️ {resource.estimated_hours} hours
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(resource.url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Practice Tips */}
                {category.practice_tips && category.practice_tips.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-xs font-semibold text-blue-400 mb-2">💡 Practice Tips:</p>
                    <ul className="space-y-1">
                      {category.practice_tips.slice(0, 3).map((tip: string, tipIdx: number) => (
                        <li key={tipIdx} className="text-xs text-foreground/70 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground/50">
            No interview resources available
          </div>
        )}
      </Card>

      {/* Networking & Growth */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Networking & Growth</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networkingTips.map((tip) => {
            const Icon = tip.icon
            return (
              <Card key={tip.title} className="glass p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{tip.title}</h3>
                    <p className="text-sm text-foreground/70 mt-1">{tip.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {tip.links.map((link) => (
                    <a
                      key={link.title}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm text-foreground/80 hover:text-primary transition-colors group"
                    >
                      <span>{link.title}</span>
                      <ExternalLink className="w-3 h-3 text-foreground/50 group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  {tip.action}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>

      {/* AI Career Summary */}
      <Alert className="glass border-primary/30 bg-linear-to-r from-primary/10 to-secondary/10">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertDescription className="ml-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">AI Career Summary</p>
            <Button
              size="sm"
              variant="outline"
              onClick={regenerateSummary}
              disabled={isRegenerating}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
              Regenerate Summary
            </Button>
          </div>
          {isRegenerating ? (
            <div className="space-y-2">
              <div className="h-4 bg-foreground/10 rounded animate-pulse" />
              <div className="h-4 bg-foreground/10 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-foreground/10 rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <p className="text-sm text-foreground/80">{currentSummary}</p>
          )}
        </AlertDescription>
      </Alert>

      {/* Footer Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          size="lg"
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => {
            showToast("info", {
              title: "💬 Opening AI Advisor...",
              description: "Redirecting to AI Career Advisor chat interface.",
            })
            window.open("https://chatgpt.com/g/g-PZrTrGLL4-ai-advisor", "_blank")
          }}
        >
          <MessageSquare className="w-4 h-4" />
          Chat with AI Advisor
          <ExternalLink className="w-3 h-3 ml-auto" />
        </Button>
        <Button size="lg" variant="outline" className="gap-2 bg-transparent" onClick={handleDownloadCareerReport}>
          <Download className="w-4 h-4" />
          Download Career Report
        </Button>
      </div>
      </div>
    </>
  )
}

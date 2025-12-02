// Frontend/lib/api/fastapi-client.ts

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

export class FastAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'FastAPIError'
  }
}

export async function uploadResumeToBackend(file: File): Promise<ResumeAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/resumes/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new FastAPIError(
        error.detail || 'Resume upload failed',
        response.status,
        error
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof FastAPIError) throw error
    throw new FastAPIError('Failed to connect to backend. Is the server running?')
  }
}

export async function getCoursesBySkill(
  skillName: string,
  limit: number = 20
): Promise<CoursesResponse> {
  try {
    const response = await fetch(
      `${FASTAPI_BASE_URL}/api/courses/by-skill/${encodeURIComponent(skillName)}?limit=${limit}`
    )

    if (!response.ok) {
      throw new FastAPIError('Failed to fetch courses', response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof FastAPIError) throw error
    throw new FastAPIError('Failed to connect to backend')
  }
}

export async function searchSkills(query: string, limit: number = 20): Promise<SkillsResponse> {
  try {
    const response = await fetch(
      `${FASTAPI_BASE_URL}/api/skills/search?query=${encodeURIComponent(query)}&limit=${limit}`
    )

    if (!response.ok) {
      throw new FastAPIError('Failed to search skills', response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof FastAPIError) throw error
    throw new FastAPIError('Failed to connect to backend')
  }
}

export async function getSystemStats(): Promise<SystemStatsResponse> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/stats`)

    if (!response.ok) {
      throw new FastAPIError('Failed to fetch stats', response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof FastAPIError) throw error
    throw new FastAPIError('Failed to connect to backend')
  }
}

export async function getCandidate(candidateId: number): Promise<CandidateResponse> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/candidates/${candidateId}`)

    if (!response.ok) {
      throw new FastAPIError('Failed to fetch candidate', response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof FastAPIError) throw error
    throw new FastAPIError('Failed to connect to backend')
  }
}

// TYPE DEFINITIONS
export interface ResumeAnalysisResponse {
  success: boolean
  candidate_id: number
  resume_id: string
  name: string
  email: string
  phone?: string
  location?: string
  skills: {
    total: number
    all_skills: string[]
    categorized?: Record<string, string[]>
    extraction_methods?: string
  }
  skill_gaps: {
    coverage: number
    missing_count: number
    priority_gaps: string[]
    gaps_by_category?: Record<string, number>
  }
  recommendations: BackendCourse[]
  processing?: {
    method?: string
    text_extracted?: number
    file_format?: string
    upload_id?: string
  }
}

export interface BackendCourse {
  id: number
  title: string
  platform: string
  url: string
  rating?: number
  level?: string
  description?: string
}

export interface CoursesResponse {
  success: boolean
  skill: string
  count: number
  courses: BackendCourse[]
}

export interface SkillsResponse {
  success: boolean
  query: string
  count: number
  skills: Array<{
    id: number
    name: string
    category: string
  }>
}

export interface SystemStatsResponse {
  success: boolean
  stats: {
    total_skills: number
    total_courses: number
    total_candidates: number
    course_skill_links: number
    avg_links_per_course: number
  }
  top_skills: Array<{
    name: string
    courses: number
  }>
}

export interface CandidateResponse {
  success: boolean
  candidate: {
    id: number
    name: string
    email: string
    phone?: string
    skills: Array<{
      name: string
      category: string
    }>
  }
}

/**
 * Get detailed candidate information including skills with proficiency
 */
export async function getCandidateDetails(candidateId: number): Promise<CandidateDetailsResponse> {
  try {
    console.log(`🌐 API Call: GET /api/candidates/${candidateId}`)
    
    const response = await fetch(`${FASTAPI_BASE_URL}/api/candidates/${candidateId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`📡 Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error Response: ${errorText}`)
      throw new FastAPIError(
        `Failed to fetch candidate details: ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    console.log('📦 Parsed response data:', data)

    return data
  } catch (error) {
    console.error('❌ Error in getCandidateDetails:', error)
    throw error
  }
}

/**
 * Get skill gap analysis for a candidate
 */
export async function getSkillGaps(candidateId: number): Promise<SkillGapResponse> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/candidates/${candidateId}/skill-gaps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new FastAPIError(`Failed to fetch skill gaps: ${response.statusText}`, response.status)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching skill gaps:', error)
    throw error
  }
}

// Type definitions for new API responses
export interface CandidateDetailsResponse {
  id: number
  resume_id: string
  name: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  skills: {
    total: number
    by_category: Record<string, string[]>
    detailed: Array<{
      id: number
      name: string
      category: string
      proficiency: string  // "Beginner" | "Intermediate" | "Advanced" | "Expert"
      years?: number
    }>
  }
  experience?: any
  education?: any
  certifications?: any
}

export interface SkillGapResponse {
  candidate_id: number
  candidate_name: string
  analysis: Array<{
    category: string
    missing_skills: string[]
    under_proficiency: string[]
    strong_skills: string[]
  }>
}

// NEW ANALYTICS API FUNCTIONS

/**
 * Fetch market demand scores from Phase 1 API
 */
export async function getMarketDemand(): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/market/demand`)
    
    if (!response.ok) {
      console.error('Failed to fetch market demand:', response.statusText)
      return {}
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching market demand:', error)
    return {}
  }
}

/**
 * Fetch skill trend history from Phase 2 API
 */
export async function getSkillTrend(skillName: string, months: number = 12): Promise<SkillTrendResponse | null> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/trends/${encodeURIComponent(skillName)}?months=${months}`)
    
    if (response.status === 404) {
      console.warn(`No trend data found for skill: ${skillName}`)
      return null
    }
    
    if (!response.ok) {
      throw new FastAPIError(`Failed to fetch trends for ${skillName}`, response.status)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching trend for ${skillName}:`, error)
    throw error
  }
}

/**
 * Fetch multiple skills comparison from Phase 2 API
 */
export async function compareSkillTrends(skills: string[], months: number = 12): Promise<SkillComparisonResponse> {
  try {
    // Limit to max 10 skills
    const limitedSkills = skills.slice(0, 10)
    const skillsParam = limitedSkills.map(skill => encodeURIComponent(skill)).join(',')
    
    const response = await fetch(`${FASTAPI_BASE_URL}/api/trends/compare?skills=${skillsParam}&months=${months}`)
    
    if (!response.ok) {
      throw new FastAPIError('Failed to compare skill trends', response.status)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error comparing skill trends:', error)
    // Return empty result instead of throwing
    return {
      skills: [],
      comparison: {
        winner: null,
        highest_growth: null,
        most_stable: null,
        highest_decline: null
      }
    }
  }
}

/**
 * Fetch top movers from Phase 2 API
 */
export async function getTopMovers(
  direction: 'up' | 'down' | 'volatile' = 'up',
  limit: number = 20,
  period: number = 3
): Promise<TopMoversResponse> {
  try {
    const response = await fetch(
      `${FASTAPI_BASE_URL}/api/trends/movers?direction=${direction}&limit=${limit}&period=${period}`
    )
    
    if (!response.ok) {
      throw new FastAPIError('Failed to fetch top movers', response.status)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching top movers:', error)
    return {
      direction,
      period_months: period,
      skills: []
    }
  }
}

/**
 * Fetch category trends from Phase 2 API
 */
export async function getCategoryTrends(months: number = 12): Promise<CategoryTrendsResponse> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/trends/categories?months=${months}`)
    
    if (!response.ok) {
      throw new FastAPIError('Failed to fetch category trends', response.status)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching category trends:', error)
    return {
      categories: []
    }
  }
}

// INTERFACES FOR ANALYTICS API RESPONSES

export interface SkillTrendResponse {
  skill_name: string
  current_demand: number
  trend: 'up' | 'stable' | 'down'
  history: Array<{
    month: string
    demand_score: number
  }>
  statistics: {
    average_demand: number
    min_demand: number
    max_demand: number
    total_change: number
    percent_change: number
    volatility: number
    monthly_average_change: number
  }
}

export interface SkillComparisonResponse {
  skills: SkillTrendResponse[]
  comparison: {
    winner: string | null
    highest_growth: string | null
    most_stable: string | null
    highest_decline: string | null
  }
}

export interface TopMoversResponse {
  direction: string
  period_months: number
  skills: Array<{
    skill_name: string
    current_demand: number
    demand_change: number
    percent_change: number
    start_demand: number
    end_demand: number
    category: string
  }>
}

export interface CategoryTrendsResponse {
  categories: Array<{
    category: string
    average_demand: number
    total_change: number
    percent_change: number
    top_skills: string[]
    trend_direction: string
  }>
}

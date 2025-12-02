import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface ActivityDay {
  date: string
  hours: number
  skills: number
  analyses: number
  courses: number
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get period from query params (default: 30 days)
    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "30", 10)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Fetch all activity data in parallel
    const [sessionsData, analysesData, coursesData] = await Promise.all([
      // Get learning sessions
      supabase
        .from("learning_sessions")
        .select("date_logged, duration_minutes")
        .eq("user_id", user.id)
        .gte("date_logged", startDate.toISOString())
        .lte("date_logged", endDate.toISOString()),

      // Get gap analyses
      supabase
        .from("gap_analyses")
        .select("date_analyzed")
        .eq("user_id", user.id)
        .gte("date_analyzed", startDate.toISOString())
        .lte("date_analyzed", endDate.toISOString()),

      // Get course enrollments (completion dates or enrollment dates)
      supabase
        .from("course_enrollments")
        .select("enrollment_date, completion_date")
        .eq("user_id", user.id)
        .gte("enrollment_date", startDate.toISOString())
        .lte("enrollment_date", endDate.toISOString()),
    ])

    // Create activity map for each day in the period
    const activityMap = new Map<string, ActivityDay>()

    // Initialize all days in the period with 0 activity
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]
      activityMap.set(dateStr, {
        date: dateStr,
        hours: 0,
        skills: 0,
        analyses: 0,
        courses: 0,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Process learning sessions
    if (sessionsData.data) {
      sessionsData.data.forEach((session: any) => {
        const dateStr = new Date(session.date_logged).toISOString().split("T")[0]
        const dayData = activityMap.get(dateStr)
        if (dayData) {
          dayData.hours += Math.round((session.duration_minutes / 60) * 10) / 10
        }
      })
    }

    // Process gap analyses
    if (analysesData.data) {
      analysesData.data.forEach((analysis: any) => {
        const dateStr = new Date(analysis.date_analyzed).toISOString().split("T")[0]
        const dayData = activityMap.get(dateStr)
        if (dayData) {
          dayData.analyses += 1
        }
      })
    }

    // Process course enrollments
    if (coursesData.data) {
      coursesData.data.forEach((course: any) => {
        const dateStr = new Date(course.enrollment_date).toISOString().split("T")[0]
        const dayData = activityMap.get(dateStr)
        if (dayData) {
          dayData.courses += 1
        }
      })
    }

    // Convert map to sorted array
    const activityData = Array.from(activityMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    return NextResponse.json({
      activity: activityData,
      period,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error in activity endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

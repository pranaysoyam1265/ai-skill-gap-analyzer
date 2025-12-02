import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [skillsData, analysesData, coursesData, sessionsData] = await Promise.all([
      // Count unique skills
      supabase
        .from("user_skills")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Count gap analyses
      supabase
        .from("gap_analyses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Count enrolled courses
      supabase
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Sum total learning hours from sessions
      supabase
        .from("learning_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id),
    ])

    // Calculate statistics
    const skillsTracked = skillsData.count || 0
    const gapAnalysesPerformed = analysesData.count || 0
    const coursesEnrolled = coursesData.count || 0

    // Convert minutes to hours
    const totalMinutes = (sessionsData.data || []).reduce((sum, session) => sum + (session.duration_minutes || 0), 0)
    const learningHoursLogged = Math.round((totalMinutes / 60) * 10) / 10 // Round to 1 decimal place

    return NextResponse.json({
      skillsTracked,
      gapAnalysesPerformed,
      coursesEnrolled,
      learningHoursLogged,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error fetching statistics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

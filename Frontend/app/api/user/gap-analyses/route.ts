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

    // Fetch user's gap analyses, sorted by most recent first, limit to 5
    const { data: analyses, error } = await supabase
      .from("gap_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("date_analyzed", { ascending: false })
      .limit(5)

    if (error) {
      console.error("[v0] Error fetching gap analyses:", error)
      return NextResponse.json({ error: "Failed to fetch gap analyses" }, { status: 500 })
    }

    // Transform database records to match the expected format
    const formattedAnalyses = (analyses || []).map((analysis: any) => ({
      id: analysis.id,
      targetRole: analysis.target_role,
      matchScore: analysis.match_score,
      dateAnalyzed: new Date(analysis.date_analyzed).toISOString().split("T")[0],
      criticalGaps: analysis.critical_gaps,
      skillsToImprove: analysis.skills_to_improve,
      matchingSkills: analysis.matching_skills || [],
      gapsDetails: analysis.gaps_details || [],
      recommendations: analysis.recommendations || [],
    }))

    return NextResponse.json({
      analyses: formattedAnalyses,
      total: analyses?.length || 0,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error in gap analyses endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

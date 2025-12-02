import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("career_goals").select("*").eq("user_id", user.id).maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching career goals:", error)
      return NextResponse.json({ error: "Failed to fetch career goals" }, { status: 500 })
    }

    return NextResponse.json({ careerGoals: data || null })
  } catch (error) {
    console.error("[v0] Career goals GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const careerGoalsData = await request.json()

    // Check if career goals exist for this user
    const { data: existingGoals } = await supabase
      .from("career_goals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingGoals) {
      // Update existing career goals
      const { data, error } = await supabase
        .from("career_goals")
        .update({
          ...careerGoalsData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating career goals:", error)
        return NextResponse.json({ error: "Failed to update career goals" }, { status: 500 })
      }

      return NextResponse.json({ careerGoals: data })
    } else {
      // Create new career goals
      const { data, error } = await supabase
        .from("career_goals")
        .insert([
          {
            user_id: user.id,
            ...careerGoalsData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating career goals:", error)
        return NextResponse.json({ error: "Failed to create career goals" }, { status: 500 })
      }

      return NextResponse.json({ careerGoals: data })
    }
  } catch (error) {
    console.error("[v0] Career goals POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

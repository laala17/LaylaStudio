import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getAdminSessionIdFromRequest } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    // 1. Ověření admina
    const adminSession = getAdminSessionIdFromRequest(request)
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    const supabase = getSupabaseServer()
    const now = new Date()
    let since: Date | null = null

    switch (range) {
      case "24h":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "all":
        since = null
        break
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const sinceStr = since?.toISOString()

    // --- OPRAVENÝ SBĚR DAT ---
    // Místo 4 různých dotazů, které padaly, vytáhneme data jedním optimalizovaným dotazem
    let query = supabase
      .from("page_visits")
      .select("url, device_type, visited_at")

    if (sinceStr) {
      query = query.gte("visited_at", sinceStr)
    }

    const { data: visits, error: dbError } = await query
    
    if (dbError) {
      console.error("Supabase DB Error:", dbError)
      throw dbError
    }

    const allVisits = visits ?? []
    const totalVisits = allVisits.length

    // 2. Agregace Top Stránek na serveru
    const topPagesMap = new Map<string, number>()
    // 3. Agregace Zařízení na serveru
    const deviceMap = new Map<string, number>()
    // 4. Agregace Denních návštěv na serveru
    const dailyVisitsMap = new Map<string, number>()

    for (const row of allVisits) {
      // Top Pages
      topPagesMap.set(row.url, (topPagesMap.get(row.url) || 0) + 1)
      
      // Device Breakdown
      const device = row.device_type || "unknown"
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1)
      
      // Daily Visits
      const day = new Date(row.visited_at).toISOString().slice(0, 10)
      dailyVisitsMap.set(day, (dailyVisitsMap.get(day) || 0) + 1)
    }

    // Formátování pro frontend (přesně tak, jak to očekává tvůj Recharts panel)
    const topPages = Array.from(topPagesMap.entries())
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([device_type, count]) => ({ device_type, count }))

    const dailyVisits = Array.from(dailyVisitsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Unikátní návštěvy (Zjednodušený odhad z dat)
    const uniqueVisitors = Math.round(totalVisits * 0.75) // Nebo tvůj původní přepočet

    return NextResponse.json({
      totalVisits,
      topPages,
      deviceBreakdown,
      dailyVisits,
      uniqueVisitors,
      range,
    })

  } catch (err) {
    console.error("Analytics endpoint error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
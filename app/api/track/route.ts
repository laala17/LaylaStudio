import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

function getClientIp(request: NextRequest): string {
  // Parse x-forwarded-for first (standard proxy header)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list: "client, proxy1, proxy2"
    // The first IP is the original client
    const ip = forwarded.split(",")[0].trim()
    if (ip && ip !== "unknown") return ip
  }

  // Fallback to x-real-ip (common nginx header)
  const realIp = request.headers.get("x-real-ip")
  if (realIp && realIp !== "unknown") return realIp

  // Last resort
  return "unknown"
}

function createDailyIpHash(ip: string): string {
  // Create a daily-changing hash: SHA256(IP + YYYY-MM-DD)
  // This ensures the hash is anonymized (cannot be reversed to IP)
  // and changes daily for privacy (a visitor on different days gets different hashes)
  const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
  const salt = "visitor-salt" // static salt for extra anonymization
  return crypto.createHash("sha256").update(`${ip}:${today}:${salt}`).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url: string | undefined = body.url
    const deviceType: string | undefined = body.deviceType

    // Validation
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'url'" }, { status: 400 })
    }

    // Sanitize URL: only store pathname + search (no hash, no origin)
    let sanitizedUrl: string
    try {
      const parsed = new URL(url, "http://localhost")
      sanitizedUrl = parsed.pathname + parsed.search
    } catch {
      sanitizedUrl = url
    }

    // Normalize device type
    const device = deviceType === "mobile" ? "mobile" : "desktop"

    // Get client IP and create anonymized daily hash
    const clientIp = getClientIp(request)
    const ipHash = createDailyIpHash(clientIp)

    const supabase = getSupabaseServer()

    const { error } = await supabase.from("page_visits").insert({
      url: sanitizedUrl,
      visited_at: new Date().toISOString(),
      device_type: device,
      ip_hash: ipHash,
    })

    if (error) {
      // Log for debugging but never return error to client — tracking must be invisible
      if (process.env.NODE_ENV === "development") {
        console.warn("[track] Failed to insert page visit:", error.message)
      }
    }

    // Always return 204 No Content — tracking pixel style, no response body needed
    // Even on errors, the client must never know tracking failed
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[track] Error:", err)
    }
    // Always return 204, never expose tracking failures
    return new NextResponse(null, { status: 204 })
  }
}

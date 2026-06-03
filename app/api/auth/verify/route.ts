import { NextResponse } from "next/server"
import { getSessionIdFromRequest } from "@/lib/auth"
import { getUserById } from "@/lib/supabase-users"

export async function GET(request: Request) {
  const sessionId = getSessionIdFromRequest(request)

  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const user = await getUserById(sessionId)
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  if (!user.is_verified) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}

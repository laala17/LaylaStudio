import { NextResponse } from "next/server"
import { getSessionIdFromRequest } from "@/lib/auth"

export async function GET(request: Request) {
  const sessionId = getSessionIdFromRequest(request)

  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}

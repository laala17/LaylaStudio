import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionIdFromRequest } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const adminSession = getAdminSessionIdFromRequest(request)

  if (!adminSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  return NextResponse.json({ authenticated: true })
}

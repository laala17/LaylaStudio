import { NextResponse } from "next/server"
import { users } from "@/lib/db"
import { getAdminSessionIdFromRequest } from "@/lib/admin-auth"

export async function GET(request: Request) {
  const adminSession = getAdminSessionIdFromRequest(request)
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Nikdy nevracíme hesla na klienta
  const safeUsers = users.map(({ password, ...rest }) => rest)
  return NextResponse.json({ users: safeUsers })
}

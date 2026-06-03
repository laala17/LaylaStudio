import { NextRequest, NextResponse } from "next/server"
import { adminUser, verifyAdminPassword } from "@/lib/db"
import { createAdminSessionCookie } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body

  // Verify email is admin email
  if (email !== adminUser.email) {
    return NextResponse.json(
      { error: "Nesprávné přihlašovací údaje" },
      { status: 401 }
    )
  }

  // Verify password
  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "Nesprávné přihlašovací údaje" },
      { status: 401 }
    )
  }

  // Create session
  const response = NextResponse.json({ success: true })
  createAdminSessionCookie(response, adminUser.id)

  return response
}

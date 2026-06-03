import { NextResponse } from "next/server"
import { verifyUserPassword } from "@/lib/supabase-users"
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "").trim()

  if (!email || !password) {
    return NextResponse.json({ error: "Vyplňte e-mail i heslo." }, { status: 400 })
  }

  const result = await verifyUserPassword(email, password)
  if (!result.id) {
    return NextResponse.json({ error: "Neplatné přihlašovací údaje." }, { status: 401 })
  }

  if (!result.isVerified) {
    return NextResponse.json({ error: "Prosím, ověřte nejdříve svůj e-mail." }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: result.id,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
  })

  return response
}

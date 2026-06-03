import { NextResponse } from "next/server"
import { findUserByResetPasswordToken } from "@/lib/db"

export async function POST(request: Request) {
  const body = await request.json()
  const token = String(body.token || "").trim()
  const newPassword = String(body.password || "").trim()

  if (!token || !newPassword) {
    return NextResponse.json({ error: "Vyplňte token i nové heslo." }, { status: 400 })
  }

  const user = findUserByResetPasswordToken(token)
  if (!user) {
    return NextResponse.json({ error: "Neplatný nebo vypršený token." }, { status: 400 })
  }

  user.password = newPassword
  user.resetPasswordToken = null

  return NextResponse.json({ ok: true })
}

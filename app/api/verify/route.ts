import { NextResponse } from "next/server"
import { findUserByVerificationToken } from "@/lib/db"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token není uveden." }, { status: 400 })
  }

  const user = findUserByVerificationToken(token)
  if (!user) {
    return NextResponse.redirect(new URL("/login?verified=false", request.url))
  }

  user.isVerified = true
  user.verificationToken = null

  return NextResponse.redirect(new URL("/login?verified=true", request.url))
}

import { NextResponse } from "next/server"
import { findUserByVerificationToken, setUserVerifiedAndClearToken } from "@/lib/supabase-users"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token není uveden." }, { status: 400 })
  }

  const user = await findUserByVerificationToken(token)
  if (!user) {
    return NextResponse.redirect(new URL("/login?verified=false", request.url))
  }

  await setUserVerifiedAndClearToken(token)

  return NextResponse.redirect(new URL("/login?verified=true", request.url))
}

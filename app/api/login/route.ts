import { NextResponse } from "next/server"
import { verifyUserPassword } from "@/lib/supabase-users"
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth"

export async function POST() {
  // Customer login disabled — only admin login remains.
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

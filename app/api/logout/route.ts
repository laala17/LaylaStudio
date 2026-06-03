import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url))
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  })
  return response
}

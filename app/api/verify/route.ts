import { NextResponse } from "next/server"

export async function GET() {
  // Customer auth disabled — only admin login remains.
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

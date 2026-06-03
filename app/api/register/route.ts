import { NextResponse } from "next/server";

export async function POST() {
  // Customer registration disabled — only admin login remains.
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

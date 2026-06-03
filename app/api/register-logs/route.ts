import { NextResponse } from "next/server"
import { users } from "@/lib/db"

export async function GET() {
  // Vrátíme seznam všech rozpracovaných uživatelů z vaší lokální databáze
  return NextResponse.json({ users })
}
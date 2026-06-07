import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code: string | undefined = body.code

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Chybí kód slevy." }, { status: 400 })
    }

    // Clean and uppercase the code
    const cleanCode = code.trim().toUpperCase()

    if (!cleanCode) {
      return NextResponse.json({ error: "Kód slevy je prázdný." }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from("discount_codes")
      .select("id, code, discount_type, discount_value, is_active")
      .eq("code", cleanCode)
      .maybeSingle()

    if (error) {
      console.error("Failed to query discount code:", error)
      return NextResponse.json({ error: "Chyba databáze." }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Tento slevový kód neexistuje." }, { status: 404 })
    }

    if (!data.is_active) {
      return NextResponse.json({ error: "Tento slevový kód již není aktivní." }, { status: 400 })
    }

    return NextResponse.json({
      code: data.code,
      discountType: data.discount_type,
      discountValue: Number(data.discount_value),
    })
  } catch (err) {
    console.error("Validate coupon error:", err)
    return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 })
  }
}

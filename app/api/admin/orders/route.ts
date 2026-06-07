import { NextResponse } from "next/server"
import { getAdminSessionIdFromRequest } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const adminSession = getAdminSessionIdFromRequest(request)
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("app_orders")
    .select(
      "id, created_at, status, total_price, customer_first_name, customer_last_name, customer_email, customer_phone, delivery_street, delivery_street_number, delivery_city, delivery_zip_code, delivery_country, editor_state, shipping_method, shipping_cost, customer_note",
    )
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Načtení objednávek selhalo.", details: error.message }, { status: 500 })
  }

  const orders = (data ?? []).map((row: any) => ({
    id: String(row.id),
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status as "pending" | "paid" | "shipped" | "delivered",
    totalPrice: Number(row.total_price ?? 0),
    customerName: `${row.customer_first_name ?? ""} ${row.customer_last_name ?? ""}`.trim(),
    customerEmail: String(row.customer_email ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    address: `${row.delivery_street ?? ""} ${row.delivery_zip_code ?? ""} ${row.delivery_city ?? ""}`.replace(/\s+/g, " ").trim(),
    editorState: row.editor_state,
    shippingMethod: row.shipping_method ?? null,
    shippingCost: row.shipping_cost != null ? Number(row.shipping_cost) : null,
    customerNote: row.customer_note ?? null,
  }))

  return NextResponse.json({ orders })
}

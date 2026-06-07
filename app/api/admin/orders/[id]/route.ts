import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getAdminSessionIdFromRequest } from "@/lib/admin-auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin session
    const adminSession = getAdminSessionIdFromRequest(request)
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    const { error } = await supabase
      .from("app_orders")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Failed to delete order:", error)
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete order error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

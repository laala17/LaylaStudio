import { NextResponse } from "next/server"
import type { CartItem } from "@/lib/cart-context"
import type { CustomerInfo } from "@/lib/order-context"
import { getSessionIdFromRequest } from "@/lib/auth"
import { getSupabaseServer } from "@/lib/supabase-server"
import type { DragEditorState } from "@/lib/editor-state"
import { getProductById, type Product } from "@/lib/products"

type OrderCreateRequestBody = {
  customer: CustomerInfo
  items: CartItem[]
  totalPrice: number
}

type GroupedDecoration = {
  src: string
  name: string
  left: number
  top: number
  width: number
  height: number
  view: "front" | "back"
  count: number
}

type OrderEditorStateForDb = {
  background: {
    frontSrc: string
    backSrc: string
  }
  decorations: GroupedDecoration[]
}

const ORDER_STATUS_DEFAULT = "pending"

function parseStreet(streetFull: string): { street: string; streetNumber: string | null } {
  const s = streetFull.trim()
  const match = s.match(/^(.*?)(\d+\w*)\s*$/)
  if (!match) return { street: s, streetNumber: null }
  return { street: match[1].trim(), streetNumber: match[2] }
}

function groupDecorations(items: CartItem[]): OrderEditorStateForDb {
  let frontSrc = ""
  let backSrc = ""

  const map = new Map<string, GroupedDecoration>()

  for (const cartItem of items) {
    const st = cartItem.customization?.editorState
    if (!st) continue

    if (!frontSrc) frontSrc = st.background.frontSrc
    if (!backSrc) backSrc = st.background.backSrc

    const addCount = cartItem.quantity

    for (const item of st.items) {
      const key = `${item.view}|${item.src}|${item.left}|${item.top}|${item.width}|${item.height}`
      const existing = map.get(key)

      if (existing) {
        existing.count += addCount
      } else {
        map.set(key, {
          src: item.src,
          name: item.name,
          left: item.left,
          top: item.top,
          width: item.width,
          height: item.height,
          view: item.view,
          count: addCount,
        })
      }
    }
  }

  return {
    background: { frontSrc, backSrc },
    decorations: Array.from(map.values()).sort(
      (a, b) => a.view.localeCompare(b.view) || a.top - b.top || a.left - b.left,
    ),
  }
}

function readUserEmailFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)userEmail=([^;]+)/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

function buildFallbackProduct(productId: string, productName: string): Product {
  return {
    id: productId,
    name: productName || "Neznámý produkt",
    description: "",
    price: 0,
    image: "/images/placeholder.jpg",
    category: "",
    sizes: [],
    colors: [],
    inStock: true,
  }
}

export async function POST(request: Request) {
  const sessionId = getSessionIdFromRequest(request)
  const userId = sessionId ?? null

  const body = (await request.json().catch(() => null)) as OrderCreateRequestBody | null
  if (!body) {
    return NextResponse.json({ error: "Neplatná JSON žádost." }, { status: 400 })
  }

  const { customer, items, totalPrice } = body
  if (!customer || !Array.isArray(items) || typeof totalPrice !== "number") {
    return NextResponse.json({ error: "Chybí data objednávky." }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  const editorStateForDb: OrderEditorStateForDb = groupDecorations(items)
  const { street, streetNumber } = parseStreet(customer.street)

  const { data, error } = await supabase
    .from("app_orders")
    .insert({
      id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      status: ORDER_STATUS_DEFAULT,

      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone,

      delivery_street: street,
      delivery_street_number: streetNumber,
      delivery_city: customer.city,
      delivery_zip_code: customer.zipCode,
      delivery_country: customer.country,

      total_price: totalPrice,

      editor_state: editorStateForDb,
      items_snapshot: items.map((i) => ({
        id: i.id,
        productId: i.product.id,
        productName: i.product.name,
        size: i.size,
        quantity: i.quantity,
        customization: {
          previewImage: i.customization?.previewImage ?? null,
          view: i.customization?.view ?? null,
          heartBetweenBreasts: i.customization?.heartBetweenBreasts ?? null,
          padding: i.customization?.padding ?? null,
        },
      })),
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: "Uložení objednávky selhalo.", details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, orderId: data.id })
}

export async function GET(request: Request) {
  const sessionId = getSessionIdFromRequest(request)
  const userId = sessionId ?? null
  const email = readUserEmailFromCookie(request)

  const supabase = getSupabaseServer()

  let query = supabase
    .from("app_orders")
    .select(
      "id, created_at, status, total_price, customer_first_name, customer_last_name, customer_email, customer_phone, delivery_street, delivery_street_number, delivery_city, delivery_zip_code, delivery_country, items_snapshot",
    )

  if (userId) {
    query = query.eq("user_id", userId)
  } else if (email) {
    query = query.eq("customer_email", email)
  } else {
    return NextResponse.json({ orders: [] })
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Načtení objednávek selhalo.", details: error.message }, { status: 500 })
  }

  const orders = (data ?? []).map((row: any) => {
    const customer: CustomerInfo = {
      firstName: String(row.customer_first_name ?? ""),
      lastName: String(row.customer_last_name ?? ""),
      email: String(row.customer_email ?? ""),
      phone: String(row.customer_phone ?? ""),
      street: [
        String(row.delivery_street ?? ""),
        row.delivery_street_number ? ` ${String(row.delivery_street_number)}` : "",
      ].join("").trim(),
      city: String(row.delivery_city ?? ""),
      zipCode: String(row.delivery_zip_code ?? ""),
      country: String(row.delivery_country ?? ""),
    }

    const items_snapshot = Array.isArray(row.items_snapshot) ? (row.items_snapshot as any[]) : []

    const items: CartItem[] = items_snapshot.map((it) => {
      const productId = String(it.productId ?? "")
      const productName = String(it.productName ?? "")
      const product = getProductById(productId) ?? buildFallbackProduct(productId, productName)

      return {
        id: String(it.id ?? ""),
        product,
        quantity: Number(it.quantity ?? 1),
        size: String(it.size ?? ""),
        customization: {
          previewImage: it.customization?.previewImage ?? undefined,
          view: it.customization?.view ?? undefined,
          heartBetweenBreasts: it.customization?.heartBetweenBreasts ?? undefined,
          padding: it.customization?.padding ?? undefined,
        },
      }
    })

    return {
      id: String(row.id),
      createdAt: new Date(row.created_at).toISOString(),
      status: row.status as "pending" | "paid" | "shipped" | "delivered",
      totalPrice: Number(row.total_price ?? 0),
      customer,
      items,
    }
  })

  return NextResponse.json({ orders })
}

import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

type CheckoutRequestBody = {
  orderId: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CheckoutRequestBody | null
  if (!body?.orderId) {
    return NextResponse.json({ error: "Chybí orderId." }, { status: 400 })
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Chybí STRIPE_SECRET_KEY." }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const supabase = getSupabaseServer()
  const { data: orderRow, error: orderError } = await supabase
    .from("app_orders")
    .select("id,total_price,customer_email,customer_first_name,customer_last_name")
    .eq("id", body.orderId)
    .maybeSingle()

  if (orderError) {
    return NextResponse.json({ error: "Načtení objednávky selhalo.", details: orderError.message }, { status: 500 })
  }
  if (!orderRow) {
    return NextResponse.json({ error: "Objednávka nenalezena." }, { status: 404 })
  }

  const amountCzk = Number(orderRow.total_price ?? 0)
  const unitAmount = Math.round(amountCzk * 100) // CZK -> haléře

  if (!unitAmount || unitAmount <= 0) {
    return NextResponse.json({ error: "Neplatná částka k platbě." }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey)

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: orderRow.customer_email || undefined,
    line_items: [
      {
        price_data: {
          currency: "czk",
          unit_amount: unitAmount,
          product_data: {
            name: `Objednávka ${body.orderId}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: body.orderId,
    },
    success_url: `${baseUrl}/objednavka/${encodeURIComponent(body.orderId)}?paid=1`,
    cancel_url: `${baseUrl}/objednavka/${encodeURIComponent(body.orderId)}?canceled=1`,
  })

  if (!session.url) {
    return NextResponse.json({ error: "Stripe session nemá URL." }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}

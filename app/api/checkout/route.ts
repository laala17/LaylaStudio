import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

type CheckoutRequestBody = {
  orderId: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as CheckoutRequestBody | null
    if (!body?.orderId) {
      return NextResponse.json({ error: "Chybí orderId." }, { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Chybí STRIPE_SECRET_KEY." }, { status: 500 })
    }

    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin
      } catch {
        return null
      }
    })()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || reqOrigin || "http://localhost:3000"

    const supabase = getSupabaseServer()
    const { data: orderRow, error: orderError } = await supabase
      .from("app_orders")
      .select("id,total_price,customer_email,customer_first_name,customer_last_name")
      .eq("id", body.orderId)
      .maybeSingle()

    if (orderError) {
      return NextResponse.json(
        { error: "Načtení objednávky selhalo.", details: orderError.message },
        { status: 500 },
      )
    }
    if (!orderRow) {
      return NextResponse.json({ error: "Objednávka nenalezena." }, { status: 404 })
    }

    // total_price v DB může být numeric/decimal -> normalizuj na číslo
    const amountCzkRaw = orderRow.total_price ?? 0
    const amountCzk = typeof amountCzkRaw === "number" ? amountCzkRaw : Number(String(amountCzkRaw))
    const unitAmount = Math.round(amountCzk * 100) // CZK -> haléře

    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Neplatná částka k platbě.", details: { amountCzk, unitAmount } },
        { status: 400 },
      )
    }

    console.log("Stripe checkout request:", {
      orderId: body.orderId,
      unitAmount,
      currency: "czk",
      stripeKeyPrefix: stripeSecretKey.slice(0, 7),
      baseUrl,
    })

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
  } catch (error) {
    console.error("Stripe error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Stripe checkout selhal.", details: message }, { status: 500 })
  }
}

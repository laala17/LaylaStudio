import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Chybí STRIPE_SECRET_KEY." }, { status: 500 })
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: "Chybí STRIPE_WEBHOOK_SECRET." }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Chybí stripe-signature header." }, { status: 400 })
  }

  const rawBody = await request.text()

  const stripe = new Stripe(stripeSecretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      const supabase = getSupabaseServer()
      await supabase
        .from("app_orders")
        .update({ status: "paid" })
        .eq("id", orderId)
    }
  }

  return NextResponse.json({ received: true })
}

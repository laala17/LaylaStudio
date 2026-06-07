import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    // Read raw body as text — App Router doesn't parse body by default
    const rawBody = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    const stripe = getStripe()

    let event: ReturnType<typeof stripe.webhooks.constructEvent>
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature"
      console.error("Stripe webhook signature verification failed:", message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 },
      )
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId
        const paymentStatus = session.payment_status

        console.log("checkout.session.completed:", {
          orderId,
          paymentStatus,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total,
        })

        if (!orderId) {
          console.warn("Webhook received checkout.session.completed without orderId in metadata")
          return NextResponse.json({ received: true, warning: "Missing orderId" })
        }

        // Update order status in Supabase
        const supabase = getSupabaseServer()

        if (paymentStatus === "paid") {
          const { error: updateError } = await supabase
            .from("app_orders")
            .update({
              status: "zaplaceno",
              paid_at: new Date().toISOString(),
            })
            .eq("id", orderId)

          if (updateError) {
            console.error("Failed to update order to zaplaceno:", updateError)
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
          }

          console.log(`Order ${orderId} marked as zaplaceno`)
        } else {
          // Payment status is e.g. "unpaid" or "no_payment_required"
          console.log(`Order ${orderId} payment status: ${paymentStatus} (not yet paid)`)
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("checkout.session.expired:", { orderId: session.metadata?.orderId })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Acknowledge receipt to Stripe
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

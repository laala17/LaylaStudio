import Stripe from "stripe"
import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getSupabaseServer } from "@/lib/supabase-server"

const resend = new Resend(process.env.RESEND_API_KEY || "")

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
        const customerEmail = session.customer_details?.email || session.customer_email

        console.log("checkout.session.completed:", {
          orderId,
          paymentStatus,
          customerEmail,
          amountTotal: session.amount_total,
        })

        if (!orderId) {
          console.warn("Webhook received checkout.session.completed without orderId in metadata")
          return NextResponse.json({ received: true, warning: "Missing orderId" })
        }

        // Update order status in Supabase
        const supabase = getSupabaseServer()

        // Also fetch order details for the email
        const { data: orderData } = await supabase
          .from("app_orders")
          .select("id, customer_first_name, total_price")
          .eq("id", orderId)
          .maybeSingle()

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

          // Send confirmation email via Resend
          if (customerEmail) {
            const customerName = orderData?.customer_first_name || "zákazníku"
            const amountFormatted = orderData?.total_price
              ? new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", minimumFractionDigits: 0 }).format(Number(orderData.total_price))
              : "—"

            try {
              const emailResult = await resend.emails.send({
                from: "LayalaStudio <info@layalastudio.com>",
                to: customerEmail,
                subject: `Potvrzení platby — objednávka #${orderId}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #0ea5e9; font-size: 24px;">LayalaStudio</h1>
                      <p style="color: #64748b;">Personalizované plavky</p>
                    </div>

                    <div style="background: #f0f9ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                      <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">Děkujeme za platbu! 🎉</h2>
                      <p style="color: #475569; line-height: 1.6;">Dobrý den, ${customerName},</p>
                      <p style="color: #475569; line-height: 1.6;">
                        Vaše platba za objednávku <strong>#${orderId}</strong> ve výši <strong>${amountFormatted}</strong> byla úspěšně zpracována.
                      </p>
                    </div>

                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                      <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 12px;">Co bude dál?</h3>
                      <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
                        <li>Objednávku nyní zpracujeme a pustíme se do výroby</li>
                        <li>Jakmile bude hotová, odešleme vám ji</li>
                        <li>O změně stavu vás budeme informovat e-mailem</li>
                      </ul>
                    </div>

                    <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px;">
                      <p>LayalaStudio — info@layalastudio.com</p>
                      <p>Tento e-mail byl vygenerován automaticky, prosím neodpovídejte na něj.</p>
                    </div>
                  </div>
                `,
              })

              if (emailResult.error) {
                console.error("Resend API returned error:", emailResult.error)
              } else if (emailResult.data?.id) {
                console.log("Confirmation email sent:", emailResult.data.id)
              } else {
                console.log("Confirmation email sent (no ID returned)")
              }
            } catch (emailError) {
              // Log but don't fail the webhook — email failure shouldn't block order processing
              console.error("Failed to send confirmation email:", emailError)
            }
          } else {
            console.warn(`No customer email available for order ${orderId}, skipping confirmation email`)
          }
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

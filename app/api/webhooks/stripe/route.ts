import { NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import { getSupabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

function renderPaidEmailHtml(opts: { customerName: string; orderNumber: string; total: number; status: string }) {
  const formattedTotal = opts.total.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #111111; padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Layalastudio</h1>
          <p style="color: #e5e7eb; margin: 8px 0 0 0; font-size: 14px;">Platba byla úspěšně přijata</p>
        </div>

        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #111111;">Ahoj ${opts.customerName},</p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #555555;">
            díky za objednávku! Tvá platba byla úspěšně přijata.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #999999;">Číslo objednávky</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #111111; font-weight: 700;">${opts.orderNumber}</p>

            <p style="margin: 0 0 10px 0; font-size: 13px; color: #999999;">Celková cena</p>
            <p style="margin: 0 0 0; font-size: 18px; color: #111111; font-weight: 700;">${formattedTotal}</p>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 14px; color: #666666;">
            Aktuální stav: <strong>${opts.status}</strong>
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #999999;">S pozdravem,</p>
          <p style="margin: 0; font-size: 15px; color: #111111; font-weight: 600;">Layalastudio 💗</p>
        </div>
      </div>
    </body>
    </html>
  `
}

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

      // Update status (ideálně idempotentně - neposílat email víckrát při retry webhooku)
      const { data: updatedRows } = await supabase
        .from("app_orders")
        .update({ status: "paid" })
        .eq("id", orderId)
        .neq("status", "paid")
        .select("id")

      // Pokud je order už "paid", webhook se může retry-nout -> jen ignorujeme email
      const shouldSendEmail = Array.isArray(updatedRows) && updatedRows.length > 0

      if (shouldSendEmail) {
        const { data: orderRow } = await supabase
          .from("app_orders")
          .select("id,customer_first_name,customer_last_name,customer_email,total_price,status")
          .eq("id", orderId)
          .maybeSingle()

        if (orderRow?.customer_email) {
          const resendApiKey = process.env.RESEND_API_KEY
          if (resendApiKey) {
            const resend = new Resend(resendApiKey)

            await resend.emails.send({
              from: "LayalaStudio <info@layalastudio.com>",
              to: [orderRow.customer_email],
              subject: `Platba přijata | Objednávka ${orderRow.id}`,
              html: renderPaidEmailHtml({
                customerName: `${orderRow.customer_first_name || ""} ${orderRow.customer_last_name || ""}`.trim(),
                orderNumber: orderRow.id,
                total: Number(orderRow.total_price ?? 0),
                status: String(orderRow.status ?? "paid"),
              }),
            })
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

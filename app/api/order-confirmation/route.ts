import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder")

type OrderConfirmationPayload = {
  orderNumber: string
  customerName: string
  email: string
  total: number
  orderDate: string
}

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY není nakonfigurovaný. Přidej jej do .env.local." },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Neplatná JSON žádost." }, { status: 400 })
  }

  const { orderNumber, customerName, email, total, orderDate } = body as OrderConfirmationPayload

  if (!orderNumber || !customerName || !email || !total || !orderDate) {
    return NextResponse.json({ error: "Chybí požadovaná data o objednávce." }, { status: 400 })
  }

  const formattedTotal = total.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #111111; padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">LayalaStudio</h1>
          <p style="color: #e5e7eb; margin: 8px 0 0 0; font-size: 14px;">Potvrzení objednávky</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #111111;">Ahoj ${customerName},</p>
          
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #555555;">
            děkujeme za tvou objednávku, skvělá volba! ☺️✨
          </p>

          <p style="margin: 0 0 24px 0; font-size: 15px; color: #555555;">
            Tvá objednávka byla úspěšně přijata a brzy se pustím do jejího zpracování.
          </p>

          <!-- Order Summary -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 24px; margin: 30px 0;">
            <h2 style="margin: 0 0 20px 0; font-size: 16px; color: #111111; font-weight: 600;">Přehled objednávky:</h2>
            
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #999999;">Číslo objednávky</p>
              <p style="margin: 0; font-size: 15px; color: #111111; font-weight: 600;">${orderNumber}</p>
            </div>

            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #999999;">Datum objednávky</p>
              <p style="margin: 0; font-size: 15px; color: #111111; font-weight: 600;">${orderDate}</p>
            </div>

            <div>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #999999;">Celková cena</p>
              <p style="margin: 0; font-size: 18px; color: #111111; font-weight: 700;">${formattedTotal}</p>
            </div>
          </div>

          <!-- Shipping Info -->
          <p style="margin: 30px 0 12px 0; font-size: 15px; color: #555555;">
            Jakmile bude objednávka odeslána, pošlu ti další email s informacemi o doručení.
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 500;">
              ✓ Obvyklá doba dodání: <strong>3–7 pracovních dní</strong>
            </p>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 14px; color: #666666;">
            Máš-li jakékoli otázky ohledně své objednávky, neváhej se na nás obrátit.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #999999;">S pozdravem,</p>
          <p style="margin: 0; font-size: 15px; color: #111111; font-weight: 600;">LayalaStudio 💗</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [email],
      subject: "Potvrzení objednávky | LayalaStudio",
      html,
    })

    return NextResponse.json({ success: true, message: "Potvrzovací e-mail byl odeslán." })
  } catch (error) {
    console.error("Resend error:", error)
    return NextResponse.json(
      { error: "Chyba při odesílání e-mailu." },
      { status: 500 }
    )
  }
}

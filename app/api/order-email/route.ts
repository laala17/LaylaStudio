import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

type OrderEmailPayload = {
  orderNumber: string
  customerName: string
  total: number
  status: string
  action: string
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

  const { orderNumber, customerName, total, status, action } = body as OrderEmailPayload

  if (!orderNumber || !customerName || !total || !status || !action) {
    return NextResponse.json({ error: "Chybí požadovaná data o objednávce." }, { status: 400 })
  }

  const subject = `Správa objednávek: ${action} - ${orderNumber}`
  const html = `
    <div style="font-family: Inter, sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">Aktualizace objednávky</h1>
      <p style="margin: 0 0 20px; color: #475569;">Dobrý den,</p>
      <p style="margin: 0 0 20px; color: #475569;">
        Do systému přišla důležitá událost týkající se objednávky <strong>${orderNumber}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Jméno zákazníka</td>
          <td style="padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Číslo objednávky</td>
          <td style="padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Celková cena</td>
          <td style="padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0;">${total.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Nový stav</td>
          <td style="padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0;">${status}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Akce</td>
          <td style="padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0;">${action}</td>
        </tr>
      </table>

      <p style="margin: 0 0 16px; color: #475569;">Tento e-mail je zasílán automaticky po důležitých změnách v objednávkovém systému.</p>
      <p style="margin: 0; color: #475569;">S pozdravem,<br/>Tým LayalaStudio</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "muj-email@seznam.cz",
      subject,
      html,
    })

    return NextResponse.json({ success: true, message: "E-mail byl odeslán." })
  } catch (error) {
    console.error("Resend error:", error)
    return NextResponse.json(
      { error: "Chyba při odesílání e-mailu." },
      { status: 500 }
    )
  }
}

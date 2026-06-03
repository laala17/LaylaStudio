import { NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/db"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function createToken() {
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email || "").trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Zadejte e-mail." }, { status: 400 })
  }

  const user = findUserByEmail(email)
  if (user) {
    user.resetPasswordToken = createToken()

    if (!resend) {
      return NextResponse.json({ error: "Chybí RESEND_API_KEY v prostředí." }, { status: 500 })
    }

    await resend.emails.send({
      from: "Layala Studio <no-reply@layalastudio.cz>",
      to: email,
      subject: "Resetujte své heslo",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Obnovení hesla</h2>
          <p>Pro nastavení nového hesla klikněte na odkaz níže:</p>
          <a href="${appUrl}/reset-password?token=${user.resetPasswordToken}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">
            Resetovat heslo
          </a>
          <p>Pokud odkaz nefunguje, vložte do prohlížeče tuto adresu:</p>
          <p>${appUrl}/reset-password?token=${user.resetPasswordToken}</p>
        </div>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}

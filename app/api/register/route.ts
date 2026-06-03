import { NextResponse } from "next/server"
import { Resend } from "resend"
import { users, findUserByEmail, type User } from "@/lib/db"

const resendApiKey = process.env.RESEND_API_KEY
// Inicializaci necháme raději čistou, ošetříme ji přímo v POST metodě
const resend = resendApiKey ? new Resend(resendApiKey) : null
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function createToken() {
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Neplatná JSON žádost." }, { status: 400 })
    }

    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "").trim()

    if (!email || !password) {
      return NextResponse.json({ error: "Vyplňte e-mail i heslo." }, { status: 400 })
    }

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: "Uživatel s tímto e-mailem již existuje." }, { status: 400 })
    }

    const verificationToken = createToken()
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      password,
      isVerified: false,
      verificationToken,
      resetPasswordToken: null,
    }

    users.push(newUser)

    if (!resend) {
      return NextResponse.json({ error: "Chybí RESEND_API_KEY v prostředí Vercelu." }, { status: 500 })
    }

    // Obalíme odesílání e-mailu do try-catch, abychom chytili přesný důvod selhání Resendu
    try {
      await resend.emails.send({
        from: "LayalaStudio <info@layalastudio.cz>",
        to: [email],
        subject: "Dokončení registrace | Layalastudio",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #111111; padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Layalastudio</h1>
              </div>

              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #111111;">Ahoj,</p>
                
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #555555;">
                  děkujeme za registraci na našem e-shopu.
                </p>

                <p style="margin: 0 0 30px 0; font-size: 15px; color: #555555;">
                  Pro dokončení registrace prosím potvrď svou e-mailovou adresu kliknutím na tlačítko níže:
                </p>

                <div style="text-align: center; margin: 40px 0;">
                  <a href="${appUrl}/api/verify?token=${verificationToken}" style="display: inline-block; padding: 14px 32px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Potvrdit e-mail</a>
                </div>

                <p style="margin: 30px 0 0 0; font-size: 13px; color: #999999; text-align: center;">
                  Nebo zkopíruj a vlož tento odkaz do prohlížeče:<br>
                  <span style="word-break: break-all; color: #666666;">${appUrl}/api/verify?token=${verificationToken}</span>
                </p>
              </div>

              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #999999;">S pozdravem,</p>
                <p style="margin: 0; font-size: 15px; color: #111111; font-weight: 600;">Layalastudio</p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    } catch (resendError: any) {
      console.error("Detailní chyba z Resendu:", resendError)
      return NextResponse.json({ 
        error: "Resend odmítl odeslat e-mail.", 
        details: resendError.message || resendError 
      }, { status: 400 })
    }

    return NextResponse.json({ ok: true })

  } catch (globalError: any) {
    console.error("Globální chyba registrace:", globalError)
    return NextResponse.json({ error: "Interní chyba serveru při registraci." }, { status: 500 })
  }
}

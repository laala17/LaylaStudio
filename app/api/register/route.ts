import { NextResponse } from "next/server"
import { Resend } from "resend"
import { users, findUserByEmail, type User } from "@/lib/db"

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function createToken() {
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  const body = await request.json()
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
    return NextResponse.json({ error: "Chybí RESEND_API_KEY v prostředí." }, { status: 500 })
  }

  await resend.emails.send({
    from: "Layala Studio <no-reply@layalastudio.cz>",
    to: email,
    subject: "Ověřte svůj e-mail",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Vítejte v Layala Studio!</h2>
        <p>Pro dokončení registrace prosím klikněte na níže uvedený odkaz:</p>
        <a href="${appUrl}/api/verify?token=${verificationToken}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">
          Ověřit e-mail
        </a>
        <p>Pokud odkaz nefunguje, vložte tento token do prohlížeče:</p>
        <p>${appUrl}/api/verify?token=${verificationToken}</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}

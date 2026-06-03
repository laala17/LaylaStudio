"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState<string | null>(null)
  const [reset, setReset] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setVerified(searchParams.get("verified"))
    setReset(searchParams.get("reset"))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    setIsSubmitting(false)

    if (!response.ok) {
      setError(data.error || "Přihlášení se nezdařilo.")
      return
    }

    router.push("/")
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600">Přihlášení</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Vítejte zpět</h1>
          <p className="mt-3 text-sm text-slate-500">Přihlaste se pomocí e-mailu a hesla.</p>
        </div>

        {verified === "true" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 mb-6">
            Váš e-mail byl úspěšně ověřen. Můžete se nyní přihlásit.
          </div>
        ) : null}

        {reset === "true" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 mb-6">
            Heslo bylo obnovené. Přihlaste se pomocí nových údajů.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p> : null}

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              required
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-700">Heslo</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Odesílám…" : "Přihlásit se"}
          </button>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <a href="/forgot-password" className="font-semibold text-slate-950 underline-offset-4 transition hover:text-slate-700">
              Zapomněli jste heslo?
            </a>
            <a href="/register" className="font-semibold text-slate-950 underline-offset-4 transition hover:text-slate-700">
              Vytvořit účet
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

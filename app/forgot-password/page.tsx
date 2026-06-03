"use client"

import { useState, type FormEvent } from "react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()
    setIsSubmitting(false)

    if (!response.ok) {
      setError(data.error || "Požadavek se nezdařil.")
      return
    }

    setMessage("Pokud tento e-mail existuje, brzy vám zašleme odkaz pro obnovení hesla.")
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600">Obnovení hesla</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Zapomněli jste heslo?</h1>
          <p className="mt-3 text-sm text-slate-500">Zadejte svůj e-mail a my vám pošleme odkaz k vytvoření nového hesla.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p> : null}

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

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Odesílám…" : "Poslat odkaz"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Vzpomněli jste si na heslo?{' '}
            <a href="/login" className="font-semibold text-slate-950 underline-offset-4 transition hover:text-slate-700">
              Přihlásit se
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

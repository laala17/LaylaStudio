"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setToken(searchParams.get("token"))
  }, [])

  useEffect(() => {
    setError(null)
    setMessage(null)
  }, [token])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!token) {
      setError("Token pro obnovení hesla chybí.")
      return
    }

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.")
      return
    }

    if (password !== confirmPassword) {
      setError("Hesla se neshodují.")
      return
    }

    setIsSubmitting(true)

    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })

    const data = await response.json()
    setIsSubmitting(false)

    if (!response.ok) {
      setError(data.error || "Obnovení hesla se nezdařilo.")
      return
    }

    setMessage("Heslo bylo změněno. Přesměrování na přihlášení…")
    setTimeout(() => {
      router.push("/login?reset=true")
    }, 1200)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600">Obnovení hesla</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Nastavte nové heslo</h1>
          <p className="mt-3 text-sm text-slate-500">Zadejte nové heslo pro svůj účet.</p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
            Na stránce chybí token pro obnovu hesla. Ověřte prosím odkaz z e-mailu.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p> : null}
            {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p> : null}

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">Nové heslo</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                required
                minLength={6}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">Potvrzení nového hesla</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Ukládám…" : "Změnit heslo"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

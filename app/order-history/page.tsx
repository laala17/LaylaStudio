"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useOrders } from "@/lib/order-context"
import { formatPrice } from "@/lib/products"

const statusLabels = {
  pending: "Čekající",
  paid: "Zaplaceno",
  shipped: "Odesláno",
  delivered: "Doručeno",
} as const

type OrderStatus = keyof typeof statusLabels

const statusBadge = (status: OrderStatus) => {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold"
  switch (status) {
    case "delivered":
      return `${base} bg-emerald-100 text-emerald-800`
    case "shipped":
      return `${base} bg-blue-100 text-blue-800`
    case "paid":
      return `${base} bg-cyan-100 text-cyan-800`
    case "pending":
      return `${base} bg-yellow-100 text-yellow-800`
    default:
      return `${base} bg-slate-100 text-slate-800`
  }
}

const filterOptions: Array<"Vše" | OrderStatus> = ["Vše", "pending", "paid", "shipped", "delivered"]

function readUserEmailFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)userEmail=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function OrderHistoryPage() {
  const { orders } = useOrders()
  const [filter, setFilter] = useState<"Vše" | OrderStatus>("Vše")
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    setUserEmail(readUserEmailFromCookie())
  }, [])

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  )

  const customerOrders = useMemo(() => {
    if (!userEmail) return []
    return sortedOrders.filter((order) => order.customer.email.toLowerCase() === userEmail.toLowerCase())
  }, [sortedOrders, userEmail])

  const filteredOrders = useMemo(() => {
    const source = userEmail ? customerOrders : []
    if (filter === "Vše") return source
    return source.filter((order) => order.status === filter)
  }, [filter, customerOrders, userEmail])

  const totalSpent = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0)

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Moje objednávky</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Historie nákupů
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Zde najdete přehled vašich posledních objednávek a stav jejich vyřízení.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === option
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option === "Vše" ? option : statusLabels[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Zobrazené objednávky</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{filteredOrders.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Celkem utraceno</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatPrice(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {userEmail ? (
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Zobrazené objednávky pro</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{userEmail}</p>
          </div>
        ) : (
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Historie objednávek je dostupná po dokončení nákupu.</p>
            <p className="mt-2 text-sm text-slate-600">
              Při dalších objednávkách si budeme pamatovat e-mail z posledního nákupu a zobrazíme vám jen vaše objednávky.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <section key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-slate-500">Číslo objednávky</p>
                        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {order.id}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{new Date(order.createdAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className={statusBadge(order.status)}>{statusLabels[order.status]}</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {order.items.length} položka{order.items.length === 1 ? "" : "y"} · {order.customer.firstName} {order.customer.lastName}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <p className="text-lg font-semibold text-slate-950">{formatPrice(order.totalPrice)}</p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/objednavka/${order.id}`}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Zobrazit detail
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-950">Zatím nemáte žádné objednávky</h2>
              <p className="mt-2 text-sm">
                Jakmile dokončíte nákup, vaše objednávky se zde uloží. Mezitím můžete pokračovat v prohlížení kolekce.
              </p>
              <div className="mt-6 flex justify-center">
                <Link href="/kategorie/plavky" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Prohlédnout plavky
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

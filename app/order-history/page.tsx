"use client"

import { useMemo, useState } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Knihovna objednávek | LayalaStudio",
  description: "Správa a historie objednávek s filtrováním, detaily a jednoduchou simulací storna.",
}

type OrderStatus = "Doručeno" | "Rozpracováno" | "Čekající" | "Stornováno"

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

type Order = {
  id: string
  orderNumber: string
  date: string
  status: OrderStatus
  total: number
  items: OrderItem[]
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "#2026-001",
    date: "12. dubna 2026",
    status: "Doručeno",
    total: 2490,
    items: [
      {
        id: "item-1",
        name: "Beach Wave Bikini",
        quantity: 1,
        price: 1290,
        image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "item-2",
        name: "Sunset Cover-Up",
        quantity: 1,
        price: 1200,
        image: "https://images.unsplash.com/photo-1520975915112-dab508824bfc?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "2",
    orderNumber: "#2026-002",
    date: "18. dubna 2026",
    status: "Rozpracováno",
    total: 1780,
    items: [
      {
        id: "item-3",
        name: "Coral One-Piece",
        quantity: 2,
        price: 890,
        image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "3",
    orderNumber: "#2026-003",
    date: "25. dubna 2026",
    status: "Čekající",
    total: 1990,
    items: [
      {
        id: "item-4",
        name: "Tidal Trench Coat",
        quantity: 1,
        price: 1990,
        image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "4",
    orderNumber: "#2026-004",
    date: "2. května 2026",
    status: "Stornováno",
    total: 920,
    items: [
      {
        id: "item-5",
        name: "Ocean Breeze Beach Hat",
        quantity: 1,
        price: 920,
        image: "https://images.unsplash.com/photo-1495121605193-b116b5b9c5d0?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
]

const statusBadge = (status: OrderStatus) => {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold"
  switch (status) {
    case "Doručeno":
      return `${base} bg-emerald-100 text-emerald-800`
    case "Rozpracováno":
      return `${base} bg-blue-100 text-blue-800`
    case "Čekající":
      return `${base} bg-yellow-100 text-yellow-800`
    case "Stornováno":
      return `${base} bg-rose-100 text-rose-800`
    default:
      return `${base} bg-slate-100 text-slate-800`
  }
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
  }).format(value)

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<"Vše" | OrderStatus>("Vše")

  const filteredOrders = useMemo(() => {
    if (filter === "Vše") return orders
    return orders.filter((order) => order.status === filter)
  }, [filter, orders])

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const cancelOrder = (orderId: string) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId && order.status !== "Stornováno"
          ? { ...order, status: "Stornováno" }
          : order
      )
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Order Management</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Knihovna objednávek
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Prohlížejte historii objednávek, filtrovejte podle stavu a simulujte jednoduché akce jako zrušení zásilky.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(["Vše", "Doručeno", "Rozpracováno", "Čekající", "Stornováno"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === option
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option}
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
              <p className="text-sm text-slate-500">Celková suma aktuálních objednávek</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatPrice(filteredOrders.reduce((sum, order) => sum + order.total, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id)
            return (
              <section key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-slate-500">Objednávka</p>
                        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {order.orderNumber}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{order.date}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className={statusBadge(order.status)}>{order.status}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <p className="text-lg font-semibold text-slate-950">{formatPrice(order.total)}</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {isExpanded ? "Skrýt detail" : "Detail objednávky"}
                        </button>
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={order.status === "Stornováno"}
                        >
                          Zrušit objednávku
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-8">
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-20 w-20 rounded-3xl object-cover"
                            />
                            <div>
                              <h3 className="text-base font-semibold text-slate-950">{item.name}</h3>
                              <p className="mt-1 text-sm text-slate-500">Množství: {item.quantity}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-1 text-right sm:items-end">
                            <p className="text-sm text-slate-500">Cena za kus</p>
                            <p className="text-lg font-semibold text-slate-950">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )
          })}

          {filteredOrders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 shadow-sm">
              <p className="text-lg font-semibold">Žádné objednávky neodpovídají zvolenému filtru.</p>
              <p className="mt-2 text-sm">Zkontrolujte filtry nebo se vraťte k výběru Vše.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

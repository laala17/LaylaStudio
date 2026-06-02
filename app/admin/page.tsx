"use client"

import { useMemo, useState } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin dashboard | LayalaStudio",
  description: "Správa objednávek v administraci se statistikami, filtrováním a editací stavů.",
}

type OrderStatus = "Nová" | "Zaplacená" | "Odeslaná" | "Zrušená"

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
  customerName: string
  customerEmail: string
  status: OrderStatus
  total: number
  address: string
  items: OrderItem[]
}

const initialOrders: Order[] = [
  {
    id: "a1",
    orderNumber: "#2026-101",
    date: "30. května 2026",
    customerName: "Karin Novotná",
    customerEmail: "karin.novotna@example.com",
    status: "Nová",
    total: 3290,
    address: "U Stadionu 12, 110 00 Praha 1",
    items: [
      {
        id: "i1",
        name: "Tyrkysové plavky Ariana",
        quantity: 1,
        price: 1590,
        image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=240&q=80",
      },
      {
        id: "i2",
        name: "Lehký plážový župan",
        quantity: 2,
        price: 850,
        image: "https://images.unsplash.com/photo-1520975915112-dab508824bfc?auto=format&fit=crop&w=240&q=80",
      },
    ],
  },
  {
    id: "a2",
    orderNumber: "#2026-102",
    date: "28. května 2026",
    customerName: "Martin Dvořák",
    customerEmail: "martin.dvorak@example.com",
    status: "Zaplacená",
    total: 1890,
    address: "Náměstí Míru 5, 120 00 Praha 2",
    items: [
      {
        id: "i3",
        name: "Jednodílné plavky Coral",
        quantity: 1,
        price: 1890,
        image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=240&q=80",
      },
    ],
  },
  {
    id: "a3",
    orderNumber: "#2026-103",
    date: "26. května 2026",
    customerName: "Lenka Šťastná",
    customerEmail: "lenka.stastna@example.com",
    status: "Odeslaná",
    total: 2590,
    address: "Vinohradská 14, 120 00 Praha 2",
    items: [
      {
        id: "i4",
        name: "Plavky Sunset",
        quantity: 1,
        price: 1290,
        image: "https://images.unsplash.com/photo-1495121605193-b116b5b9c5d0?auto=format&fit=crop&w=240&q=80",
      },
      {
        id: "i5",
        name: "Letní plážová taška",
        quantity: 1,
        price: 1300,
        image: "https://images.unsplash.com/photo-1529059997560-82f1b13bcb6d?auto=format&fit=crop&w=240&q=80",
      },
    ],
  },
  {
    id: "a4",
    orderNumber: "#2026-104",
    date: "22. května 2026",
    customerName: "Petr Kučera",
    customerEmail: "petr.kucera@example.com",
    status: "Zrušená",
    total: 990,
    address: "Poděbradská 67, 190 00 Praha 9",
    items: [
      {
        id: "i6",
        name: "Plážové sluneční brýle",
        quantity: 1,
        price: 990,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
      },
    ],
  },
]

const statusOptions: OrderStatus[] = ["Nová", "Zaplacená", "Odeslaná", "Zrušená"]

const statusBadgeClass = (status: OrderStatus) => {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold"
  switch (status) {
    case "Nová":
      return `${base} bg-sky-100 text-sky-800`
    case "Zaplacená":
      return `${base} bg-emerald-100 text-emerald-800`
    case "Odeslaná":
      return `${base} bg-amber-100 text-amber-800`
    case "Zrušená":
      return `${base} bg-rose-100 text-rose-800`
  }
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
  }).format(value)

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"Vše" | OrderStatus>("Vše")
  const [changesSaved, setChangesSaved] = useState(false)

  const filteredOrders = useMemo(() => {
    if (filter === "Vše") return orders
    return orders.filter((order) => order.status === filter)
  }, [filter, orders])

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders])
  const newOrdersCount = useMemo(() => orders.filter((order) => order.status === "Nová").length, [orders])

  const updateStatus = (orderId: string, status: OrderStatus) => {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    )
    setChangesSaved(false)
  }

  const toggleRow = (orderId: string) => {
    setExpandedId((current) => (current === orderId ? null : orderId))
  }

  const saveChanges = () => {
    setChangesSaved(true)
    window.setTimeout(() => setChangesSaved(false), 2600)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[32px] bg-white px-6 py-8 shadow-lg ring-1 ring-slate-200 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Správa objednávek
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Administrativní přehled všech objednávek s možností změny stavu, zobrazení detailu a filtrování.
              </p>
            </div>

            <button
              onClick={saveChanges}
              className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Uložit změny
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-500">Celkový počet objednávek</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{orders.length}</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-500">Celkový obrat</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{formatPrice(totalRevenue)}</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-500">Nové / nevyřízené objednávky</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{newOrdersCount}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-[32px] bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Seznam objednávek</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vyberte řádek a zobrazte detail adresy zákazníka, nebo upravte stav objednávky přímo v tabulce.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {(["Vše", "Nová", "Zaplacená", "Odeslaná", "Zrušená"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === status
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">Zákazník</th>
                  <th className="px-6 py-4">Objednávka</th>
                  <th className="px-6 py-4">Produkty</th>
                  <th className="px-6 py-4">Celkem</th>
                  <th className="px-6 py-4">Stav</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-t border-slate-200 transition hover:bg-slate-50"
                    onClick={() => toggleRow(order.id)}
                  >
                    <td className="px-6 py-5 align-top">
                      <p className="font-semibold text-slate-950">{order.customerName}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.date}</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="grid gap-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-10 w-10 rounded-2xl object-cover"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                              <p className="text-xs text-slate-500">x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top font-semibold text-slate-950">{formatPrice(order.total)}</td>
                    <td className="px-6 py-5 align-top">
                      <span className={statusBadgeClass(order.status)}>{order.status}</span>
                      <label className="mt-3 block text-sm font-medium text-slate-500">
                        Změnit stav
                      </label>
                      <select
                        value={order.status}
                        onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {statusOptions.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="border-t border-slate-200 p-8 text-center text-slate-500">
              Žádné objednávky pro zvolený filtr.
            </div>
          )}

          {expandedId && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-8">
              {orders
                .filter((order) => order.id === expandedId)
                .map((order) => (
                  <div key={order.id} className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">Detail doručovací adresy</h3>
                        <p className="mt-1 text-sm text-slate-600">Zákazník: {order.customerName}</p>
                      </div>
                      <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                      <p className="text-sm font-semibold text-slate-900">Doručovací adresa</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{order.address}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {changesSaved && (
          <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-900 shadow-sm">
            Změny byly úspěšně uloženy.
          </div>
        )}
      </div>
    </main>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type AdminOrderStatus = "pending" | "paid" | "shipped" | "delivered"

type AdminOrder = {
  id: string
  createdAt: string
  status: AdminOrderStatus
  totalPrice: number
  customerName: string
  customerEmail: string
  address: string
  editorState: {
    background: { frontSrc: string; backSrc: string }
    decorations: Array<{
      src: string
      name: string
      left: number
      top: number
      width: number
      height: number
      view: "front" | "back"
      count: number
    }>
  } | null
}

const statusLabels: Record<AdminOrderStatus, string> = {
  pending: "Čekající",
  paid: "Zaplaceno",
  shipped: "Odesláno",
  delivered: "Doručeno",
}

function statusBadgeClass(status: AdminOrderStatus) {
  switch (status) {
    case "delivered":
      return "bg-emerald-100 text-emerald-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "paid":
      return "bg-cyan-100 text-cyan-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function groupDecorationsReadable(editorState: AdminOrder["editorState"]) {
  if (!editorState) return []

  return editorState.decorations
    .slice()
    .sort((a, b) => a.view.localeCompare(b.view) || a.top - b.top || a.left - b.left)
    .flatMap((d) => {
      const label = `${d.name} - na pozici X:${Math.round(d.left)}, Y:${Math.round(d.top)}`
      return [{ key: `${d.view}|${label}|${d.src}`, text: label, count: d.count, view: d.view }]
    })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) ?? null, [orders, selectedOrderId])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/admin/orders", { method: "GET" })
        if (!res.ok) throw new Error(`GET /api/admin/orders failed: ${res.status}`)
        const data = (await res.json()) as { orders: AdminOrder[] }
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch (e) {
        if (!cancelled) setOrders([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const detailLines = useMemo(() => groupDecorationsReadable(selectedOrder?.editorState ?? null), [selectedOrder])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Objednávky pro výrobu</h1>
        <p className="text-muted-foreground mt-2">
          Klikni na „Zobrazit detail pro výrobu“ a uvidíš konfiguraci z editoru v režimu čtení.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        <section className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Seznam objednávek</h2>
            <p className="text-sm text-muted-foreground mt-1">{orders.length} objednávek</p>
          </div>

          <div className="p-4 overflow-auto max-h-[70vh]">
            {orders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Zatím žádné objednávky.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-4 ${selectedOrderId === order.id ? "border-slate-950 bg-slate-50" : "border-border bg-card"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm">#{order.id}</p>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mt-2 truncate">
                          {order.customerName} · {order.address}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(order.createdAt)}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="font-semibold text-sm">{order.totalPrice} Kč</p>
                        <Button
                          type="button"
                          variant={selectedOrderId === order.id ? "default" : "outline"}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          Zobrazit detail pro výrobu
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-border bg-card overflow-hidden lg:sticky lg:top-6">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Detail</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedOrder ? `Objednávka #${selectedOrder.id}` : "Vyber objednávku"}
            </p>
          </div>

          {!selectedOrder ? (
            <div className="p-6 text-muted-foreground text-sm">Vyber objednávku ze seznamu.</div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Zákazník</p>
                <p className="text-sm font-semibold">{selectedOrder.customerName}</p>
                <p className="text-xs text-muted-foreground break-all">{selectedOrder.customerEmail}</p>
                <p className="text-sm text-muted-foreground mt-2">Doručení</p>
                <p className="text-sm">{selectedOrder.address}</p>
              </div>

              {/* Read-only "very clear" list */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Co ušít (read-only)</p>
                {detailLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Konfigurace není k dispozici.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {detailLines.map((line) => (
                      <li key={line.key} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {line.view === "front" ? "Zepředu" : "Zezadu"} · {line.text}
                        </span>
                        <span className="font-semibold whitespace-nowrap">{line.count}ks</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Optional: simple visual preview */}
              {selectedOrder.editorState ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Náhled konfigurace</p>
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-slate-50">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${selectedOrder.editorState.background.frontSrc})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: 0.9,
                      }}
                    />
                    {selectedOrder.editorState.decorations
                      .filter((d) => d.view === "front")
                      .map((d) => (
                        <div
                          key={`preview-${selectedOrder.id}-${d.src}-${d.left}-${d.top}-${d.width}-${d.height}`}
                          className="absolute"
                          style={{
                            left: d.left,
                            top: d.top,
                            width: d.width,
                            height: d.height,
                          }}
                        >
                          <img src={d.src} alt={d.name} className="w-full h-full object-contain pointer-events-none select-none" />
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Zobrazen je pouze pohled „Zepředu“ (kvůli rychlému orientačnímu náhledu).
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

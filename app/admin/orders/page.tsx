"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AdminEditorView } from "@/components/admin-editor-view"
import { computePricing } from "@/lib/editor-state"
import type { DragEditorState } from "@/lib/editor-state"

type AdminOrderStatus = "pending" | "paid" | "shipped" | "delivered"

type AdminOrder = {
  id: string
  createdAt: string
  status: AdminOrderStatus
  totalPrice: number
  customerName: string
  customerEmail: string
  customerPhone: string
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
  shippingMethod: string | null
  shippingCost: number | null
  customerNote: string | null
}

function editorStateToDragEditorState(raw: AdminOrder["editorState"]): DragEditorState | null {
  if (!raw) return null
  const items = raw.decorations.map((d, idx) => ({
    id: `dec-${idx}`,
    src: d.src,
    name: d.name,
    left: d.left,
    top: d.top,
    width: d.width,
    height: d.height,
    view: d.view,
  }))
  return {
    selectedView: "front",
    background: raw.background,
    items,
    pricing: computePricing(items, 0),
  }
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) ?? null, [orders, selectedOrderId])

  const dragEditorState = useMemo(
    () => editorStateToDragEditorState(selectedOrder?.editorState ?? null),
    [selectedOrder],
  )

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
          Klikni na objednávku a uvidíš konfiguraci z editoru v režimu čtení.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_720px] gap-6 items-start">
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
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={selectedOrderId === order.id ? "default" : "outline"}
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            Detail
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === order.id}
                            onClick={async () => {
                              if (!confirm(`Opravdu chcete smazat objednávku #${order.id}?`)) return
                              setDeletingId(order.id)
                              try {
                                const res = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" })
                                if (!res.ok) throw new Error("Delete failed")
                                setOrders((prev) => prev.filter((o) => o.id !== order.id))
                                if (selectedOrderId === order.id) setSelectedOrderId(null)
                              } catch (e) {
                                console.error("Delete error:", e)
                                alert("Nepodařilo se smazat objednávku.")
                              } finally {
                                setDeletingId(null)
                              }
                            }}
                          >
                            {deletingId === order.id ? "..." : "Smazat"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="lg:sticky lg:top-6">
          {!selectedOrder ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
              Vyber objednávku ze seznamu.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card overflow-hidden p-6">
                <h2 className="text-lg font-semibold mb-1">Detail objednávky #{selectedOrder.id}</h2>
                <p className="text-xs text-muted-foreground mb-4">{formatDateTime(selectedOrder.createdAt)}</p>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Zákazník</p>
                  <p className="text-sm font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-xs text-muted-foreground break-all">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-xs text-muted-foreground">{selectedOrder.customerPhone}</p>
                  )}

                  <p className="text-sm text-muted-foreground mt-2">Doručení</p>
                  <p className="text-sm">{selectedOrder.address}</p>

                  <p className="text-sm text-muted-foreground mt-2">Doprava</p>
                  <div className="text-sm space-y-1">
                    {selectedOrder.shippingMethod ? (
                      <>
                        <p>
                          {selectedOrder.shippingMethod === "ppl"
                            ? "PPL"
                            : selectedOrder.shippingMethod === "gls"
                            ? "GLS"
                            : "Zásilkovna / Z-BOX"}
                          {selectedOrder.shippingCost != null && ` — ${selectedOrder.shippingCost} Kč`}
                        </p>
                        {selectedOrder.shippingMethod === "packeta" && selectedOrder.address.startsWith("Zásilkovna:") && (
                          <p className="text-xs text-muted-foreground break-all">
                            {selectedOrder.address.split(" ---")[0]}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Neuvedeno</p>
                    )}
                  </div>

                  {/* Customer note */}
                  {selectedOrder.customerNote && (
                    <>
                      <p className="text-sm text-muted-foreground mt-2">Poznámka zákazníka</p>
                      <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 whitespace-pre-wrap break-words">
                        {selectedOrder.customerNote}
                      </div>
                    </>
                  )}

                  <p className="text-sm text-muted-foreground mt-2">Doplňky</p>
                  <div className="text-sm space-y-1">
                    {dragEditorState?.pricing.decorationCounts &&
                    Object.keys(dragEditorState.pricing.decorationCounts).length > 0 ? (
                      Object.entries(dragEditorState.pricing.decorationCounts).map(([name, count]) => (
                        <p key={name}>+{count}× {name}</p>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Žádné dekorace</p>
                    )}
                    {dragEditorState?.pricing.heartCount != null && dragEditorState.pricing.heartCount > 0 && (
                      <p>+{dragEditorState.pricing.heartCount}× Srdíčko</p>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">Celková cena</p>
                  <p className="text-sm font-semibold">{selectedOrder.totalPrice} Kč</p>
                </div>
              </div>

              <AdminEditorView editorState={dragEditorState} />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

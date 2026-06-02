"use client"

import { use } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { useOrders } from "@/lib/order-context"
import { formatPrice } from "@/lib/products"
import { Button } from "@/components/ui/button"

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = use(params)
  const { getOrderById } = useOrders()
  const order = getOrderById(id)

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-4">Objednávka nenalezena</h1>
          <p className="text-muted-foreground mb-8">
            Tato objednávka neexistuje nebo byla odstraněna.
          </p>
          <Link href="/">
            <Button>Zpět na hlavní stránku</Button>
          </Link>
        </div>
      </div>
    )
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-semibold mb-4">Děkujeme za objednávku!</h1>
          <p className="text-muted-foreground">
            Vaše objednávka byla úspěšně přijata. Potvrzení jsme vám odeslali na e-mail.
          </p>
        </div>

        {/* Order Details */}
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground">Číslo objednávky</p>
              <p className="font-semibold">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Datum</p>
              <p className="font-medium">{orderDate}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Položky objednávky</h3>
            <div className="space-y-6">
              {order.items.map((item, index) => (
                <div key={index} className="rounded-xl border border-border p-4 bg-card">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-medium">
                        {item.product.name} (vel. {item.size}) × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground space-y-1">
                      {item.customization?.view ? (
                        <p>
                          Strana: {item.customization.view === "front" ? "Zepředu" : "Zezadu"}
                        </p>
                      ) : null}
                      {item.customization?.heartBetweenBreasts ? (
                        <p>Srdíčko mezi prsa</p>
                      ) : null}
                      {item.customization?.padding ? (
                        <p>Vycpávky</p>
                      ) : null}
                    </div>
                    {item.customization?.previewImage ? (
                      <img
                        src={item.customization.previewImage}
                        alt="Náhled úpravy"
                        className="w-full rounded-xl border border-border object-cover max-h-72 mt-4"
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Celkem</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          <h3 className="font-semibold mb-4">Doručovací adresa</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="text-foreground font-medium">
              {order.customer.firstName} {order.customer.lastName}
            </p>
            <p>{order.customer.street}</p>
            <p>
              {order.customer.zipCode} {order.customer.city}
            </p>
            <p>{order.customer.country}</p>
            <p className="pt-2">{order.customer.email}</p>
            <p>{order.customer.phone}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/kategorie/plavky">
            <Button variant="outline" className="w-full sm:w-auto">
              Pokračovat v nákupu
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto">
              Zpět na hlavní stránku
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

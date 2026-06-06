"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { StaticSwimwearPreview, SurchargeList } from "@/components/static-swimwear-preview"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart()

  const shippingCost = totalPrice >= 1500 ? 0 : 106
  const finalTotal = totalPrice + shippingCost

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">Váš košík je prázdný</h1>
          <p className="text-muted-foreground mb-8">
            Přidejte do košíku své oblíbené plavky
          </p>
          <Link href="/kategorie/plavky">
            <Button>Prohlédnout plavky</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">Domů</a>
        <span className="mx-2">/</span>
        <span className="text-foreground">Košík</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight mb-8">Nákupní košík</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl border border-border bg-card"
            >
              {/* Preview image or static preview */}
              <div className="flex-shrink-0">
                {item.customization?.exportData ? (
                  <StaticSwimwearPreview exportData={item.customization.exportData} size="sm" />
                ) : (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/produkt/${item.product.id}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      Velikost: {item.size}
                    </p>

                    {/* Export data surcharge list */}
                    {item.customization?.exportData && (
                      <div className="mt-2">
                        <SurchargeList exportData={item.customization.exportData} />
                      </div>
                    )}

                    {/* Legacy customization flags */}
                    {!item.customization?.exportData && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        {item.customization?.heartBetweenBreasts ? (
                          <p>1× Srdíčko mezi prsa</p>
                        ) : null}
                        {item.customization?.padding ? (
                          <p>Vycpávky</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-6">Souhrn objednávky</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mezisoučet</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Doprava</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Zdarma</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              {totalPrice < 1500 && (
                <p className="text-xs text-muted-foreground">
                  Pro dopravu zdarma nakupte ještě za{" "}
                  {formatPrice(1500 - totalPrice)}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between font-semibold">
                <span>Celkem</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <Link href="/pokladna" className="block">
              <Button className="w-full" size="lg">
                Pokračovat k pokladně
              </Button>
            </Link>

            <Link
              href="/kategorie/plavky"
              className="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pokračovat v nákupu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

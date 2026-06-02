"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import { useOrders, type CustomerInfo } from "@/lib/order-context"
import { formatPrice } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { addOrder } = useOrders()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zipCode: "",
    country: "Česká republika",
  })

  const shippingCost = totalPrice >= 1500 ? 0 : 99
  const finalTotal = totalPrice + shippingCost

  // Handle redirect in useEffect to avoid calling router.push during render
  useEffect(() => {
    // Wait for cart hydration
    const timer = setTimeout(() => {
      if (items.length === 0) {
        router.push("/kosik")
      } else {
        setIsLoading(false)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [items, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Create order
    const order = addOrder(items, formData, finalTotal)

    // Clear cart
    clearCart()

    // Redirect to confirmation page
    router.push(`/objednavka/${order.id}`)
  }

  if (isLoading || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">Domů</a>
        <span className="mx-2">/</span>
        <a href="/kosik" className="hover:text-foreground transition-colors">Košík</a>
        <span className="mx-2">/</span>
        <span className="text-foreground">Pokladna</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight mb-8">Pokladna</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Info */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Kontaktní údaje</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Jméno *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Příjmení *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Doručovací adresa</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Ulice a číslo popisné *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Město *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">PSČ *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Země</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Způsob platby</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-4 p-4 rounded-lg border border-primary bg-primary/5 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    defaultChecked
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium">Platba kartou</p>
                    <p className="text-sm text-muted-foreground">
                      Bezpečná platba přes Stripe
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-muted-foreground cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium">Bankovní převod</p>
                    <p className="text-sm text-muted-foreground">
                      Platba předem na účet
                    </p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * Pro aktivaci online platby přidejte Stripe API klíče
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Vaše objednávka</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vel.: {item.size}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3 mb-6">
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
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Celkem</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Zpracovávám..." : "Dokončit objednávku"}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Kliknutím na tlačítko souhlasíte s obchodními podmínkami
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import { useOrders, type CustomerInfo } from "@/lib/order-context"
import { formatPrice } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

interface GuestInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  zipCode: string
  country: string
}

function buildCustomerInfo(guestInfo: GuestInfo): CustomerInfo {
  const parts = guestInfo.fullName.trim().split(" ").filter(Boolean)
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
    email: guestInfo.email,
    phone: guestInfo.phone,
    street: guestInfo.address,
    city: guestInfo.city,
    zipCode: guestInfo.zipCode,
    country: guestInfo.country,
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { addOrder } = useOrders()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isQuickOrder, setIsQuickOrder] = useState(false)
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
  const [guestData, setGuestData] = useState<GuestInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
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

  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGuestData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const customerInfo = isQuickOrder ? buildCustomerInfo(guestData) : formData

    // Save current customer email to cookie so historie objednávek zůstane osobní
    document.cookie = `userEmail=${encodeURIComponent(customerInfo.email)}; path=/; max-age=31536000; SameSite=Lax`

    // Uložit objednávku do Supabase + získat orderId
    let orderId: string | null = null
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerInfo,
          items,
          totalPrice: finalTotal,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.orderId) {
        console.error("Uložení objednávky selhalo:", data)
        return
      }

      orderId = String(data.orderId)
    } catch (error) {
      console.error("Chyba při ukládání objednávky:", error)
      return
    }

    const order = addOrder(items, customerInfo, finalTotal, { id: orderId ?? undefined })

    // Send order confirmation email
    try {
      const orderDate = new Date().toLocaleDateString("cs-CZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })

      await fetch("/api/order-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.id,
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          total: finalTotal,
          orderDate,
        }),
      })
    } catch (error) {
      console.error("Chyba při odesílání potvrzovacího emailu:", error)
    }

    // Clear cart
    clearCart()

    // Redirect to Stripe checkout
    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      const checkoutData = await checkoutRes.json().catch(() => null)
      if (checkoutRes.ok && checkoutData?.url) {
        window.location.href = String(checkoutData.url)
        return
      }
    } catch (error) {
      console.error("Chyba při vytvoření Stripe checkoutu:", error)
    }

    // Fallback: redirect to confirmation page if Stripe redirect fails
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsQuickOrder(false)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  !isQuickOrder ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Plná objednávka
              </button>
              <button
                type="button"
                onClick={() => setIsQuickOrder(true)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  isQuickOrder ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Rychlá objednávka bez registrace
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              {isQuickOrder ? (
                <p>
                  Vyplňte pouze základní údaje a objednávku dokončíte bez registrace. Adresa a e-mail jsou povinné.
                </p>
              ) : (
                <p>
                  Plná objednávka zahrnuje kompletní kontaktní údaje a doručovací adresu. Pokud chcete rychle objednat, zvolte rychlý režim.
                </p>
              )}
            </div>

            {isQuickOrder ? (
              <>
                <div className="p-6 rounded-xl border border-border bg-card">
                  <h2 className="text-lg font-semibold mb-6">Rychlá objednávka</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Jméno a příjmení *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={guestData.fullName}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={guestData.email}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={guestData.phone}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Ulice a číslo popisné *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={guestData.address}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Město *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={guestData.city}
                          onChange={handleGuestInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">PSČ *</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={guestData.zipCode}
                          onChange={handleGuestInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Země</Label>
                      <Input
                        id="country"
                        name="country"
                        value={guestData.country}
                        onChange={handleGuestInputChange}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card">
                  <h2 className="text-lg font-semibold mb-6">Způsob platby</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-4 p-4 rounded-lg border border-primary bg-primary/5 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentQuick"
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
                        name="paymentQuick"
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
              </>
            ) : (
              <>
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
          </>
            )}
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

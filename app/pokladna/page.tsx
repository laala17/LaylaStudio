"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import type { CustomerInfo } from "@/lib/order-context"
import { formatPrice } from "@/lib/products"
import { computePricing, type DiscountInfo } from "@/lib/editor-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { StaticSwimwearPreview, SurchargeList } from "@/components/static-swimwear-preview"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [shippingMethod, setShippingMethod] = useState<"ppl" | "gls" | "packeta">("ppl")
  const [packetaAddress, setPacketaAddress] = useState("")
  const [packetaError, setPacketaError] = useState(false)
  const [note, setNote] = useState("")
  const packetaInputRef = useRef<HTMLInputElement>(null)

  // Discount state
  const [couponCode, setCouponCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountInfo | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const preventCartRedirectRef = useRef(false)

  async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

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

  // Shipping costs
  const shippingCost = shippingMethod === "packeta" ? 89 : shippingMethod === "gls" ? 94 : 0

  // Calculate discount on totalPrice (product prices only, not shipping)
  const discountAmount = appliedDiscount
    ? appliedDiscount.discountType === "percentage"
      ? Math.round(totalPrice * (appliedDiscount.discountValue / 100))
      : Math.min(appliedDiscount.discountValue, totalPrice)
    : 0

  const finalTotal = totalPrice - discountAmount + shippingCost

  const isPacketaInvalid = shippingMethod === "packeta" && !packetaAddress.trim()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length === 0) {
        if (!preventCartRedirectRef.current) router.push("/kosik")
        else setIsLoading(false)
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

  const handlePacketaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPacketaAddress(e.target.value)
    if (e.target.value.trim()) {
      setPacketaError(false)
    }
  }

  const handleShippingChange = (method: "ppl" | "gls" | "packeta") => {
    setShippingMethod(method)
    if (method !== "packeta") {
      setPacketaAddress("")
      setPacketaError(false)
    }
  }

  // Apply coupon
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return

    setCouponLoading(true)
    setCouponError(null)

    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const json = await res.json()

      if (!res.ok) {
        setCouponError(json.error || "Neplatný kód")
        setAppliedDiscount(null)
        return
      }

      // Calculate discount amount immediately for preview
      let discountAmount = 0
      if (json.discountType === "percentage") {
        discountAmount = Math.round(totalPrice * (json.discountValue / 100))
      } else {
        discountAmount = Math.min(json.discountValue, totalPrice)
      }

      setAppliedDiscount({
        code: json.code,
        discountType: json.discountType,
        discountValue: json.discountValue,
        discountAmount,
      })
      setCouponCode(json.code)
    } catch {
      setCouponError("Chyba při ověřování kódu")
      setAppliedDiscount(null)
    } finally {
      setCouponLoading(false)
    }
  }

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedDiscount(null)
    setCouponCode("")
    setCouponError(null)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate Packeta address
    if (shippingMethod === "packeta" && !packetaAddress.trim()) {
      setPacketaError(true)
      packetaInputRef.current?.focus()
      alert("Chyba: Před dokončením objednávky musíte vyplnit název nebo adresu pobočky Zásilkovny.")
      return
    }

    setIsSubmitting(true)
    setPaymentError("Začínám zpracování objednávky…")
    preventCartRedirectRef.current = false

    const customerInfo = { ...formData }
    let finalNote = note

    // If Packeta, prepend branch info to note
    if (shippingMethod === "packeta" && packetaAddress.trim()) {
      customerInfo.street = `Zásilkovna: ${packetaAddress.trim()}`
      customerInfo.city = ""
      customerInfo.zipCode = ""
      finalNote = "DOPRAVA ZÁSILKOVNA: " + packetaAddress.trim() + "\n\n" + finalNote
    }

    // Append discount info to note if applied
    if (appliedDiscount) {
      const discountLine = `SLEVOVÝ KÓD: ${appliedDiscount.code} (${appliedDiscount.discountAmount} Kč)`
      finalNote = finalNote ? discountLine + "\n\n" + finalNote : discountLine
    }

    document.cookie = `userEmail=${encodeURIComponent(customerInfo.email)}; path=/; max-age=31536000; SameSite=Lax`

    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const orderData = {
        customer: customerInfo,
        items,
        totalPrice: finalTotal,
        shippingMethod,
        shippingCost,
        note: finalNote,
        discount: appliedDiscount
          ? {
              code: appliedDiscount.code,
              discountType: appliedDiscount.discountType,
              discountValue: appliedDiscount.discountValue,
              discountAmount: appliedDiscount.discountAmount,
            }
          : null,
      }

      setPaymentError("Ukládám objednávku do databáze…")
      const orderRes = await withTimeout(
        fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        }),
        15000,
        "Timeout při ukládání objednávky (/api/orders).",
      )

      const orderJson = (await orderRes.json().catch(() => null)) as { orderId?: string; error?: string } | null
      if (orderRes.status !== 200) {
        throw { source: "/api/orders", status: orderRes.status, response: orderJson }
      }
      if (!orderJson?.orderId) {
        throw { source: "/api/orders", status: orderRes.status, response: orderJson }
      }

      const orderId = String(orderJson.orderId)
      console.log("Objednávka uložena, ID:", orderId)
      setPaymentError("Objednávka uložena. Přípravuji platbu…")

      preventCartRedirectRef.current = true
      clearCart()

      const checkoutRes = await withTimeout(
        fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, items }),
        }),
        15000,
        "Timeout při vytváření Stripe checkoutu (/api/checkout).",
      )

      const checkoutJson = (await checkoutRes.json().catch(() => null)) as { url?: string; error?: string } | null
      if (checkoutRes.status !== 200) {
        throw { source: "/api/checkout", status: checkoutRes.status, response: checkoutJson }
      }
      if (!checkoutJson?.url || typeof checkoutJson.url !== "string") {
        throw { source: "/api/checkout", status: checkoutRes.status, response: checkoutJson }
      }

      setPaymentError("Přesměrovávám na Stripe…")
      window.location.href = checkoutJson.url
    } catch (error) {
      console.error("Chyba při odeslání objednávky:", error)
      window.alert(JSON.stringify(error))

      const message =
        error instanceof Error
          ? error.message
          : (typeof error === "object" && error && "source" in error ? `${(error as any).source} failed` : "Neznámá chyba při odeslání objednávky.")
      setPaymentError(message)
      setIsSubmitting(false)
      preventCartRedirectRef.current = false
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
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
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* ============= SHIPPING SECTION ============= */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Způsob doručení</h2>

              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  shippingMethod === "ppl"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="ppl"
                    checked={shippingMethod === "ppl"}
                    onChange={() => handleShippingChange("ppl")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium">Doručení na adresu (PPL)</p>
                    <p className="text-sm text-muted-foreground">Zdarma</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  shippingMethod === "gls"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="gls"
                    checked={shippingMethod === "gls"}
                    onChange={() => handleShippingChange("gls")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium">Doručení na adresu (GLS)</p>
                    <p className="text-sm text-muted-foreground">94 Kč</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  shippingMethod === "packeta"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="packeta"
                    checked={shippingMethod === "packeta"}
                    onChange={() => handleShippingChange("packeta")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium">Zásilkovna / Z-BOX</p>
                    <p className="text-sm text-muted-foreground">89 Kč</p>
                  </div>
                </label>
              </div>

              {/* Packeta panel — shown only when Zásilkovna is selected */}
              <div
                className={`mt-5 overflow-hidden transition-all duration-300 ${
                  shippingMethod === "packeta"
                    ? "max-h-80 opacity-100"
                    : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>1. Klikněte na tlačítko níže a najděte si na oficiální mapě svůj Z-BOX nebo pobočku.</p>
                    <p>2. Zkopírujte její název nebo adresu.</p>
                    <p>3. Vložte zkopírovaný text do pole níže.</p>
                  </div>

                  <a
                    href="https://www.zasilkovna.cz/pobocky"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ff6624] text-white font-medium text-sm hover:bg-[#e5551f] transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Otevřít oficiální mapu Zásilkovny
                  </a>

                  <div className="space-y-2">
                    <Label htmlFor="packetaAddress">Název nebo adresa pobočky/boxu:</Label>
                    <Input
                      ref={packetaInputRef}
                      id="packetaAddress"
                      name="packetaAddress"
                      value={packetaAddress}
                      onChange={handlePacketaChange}
                      placeholder="Např. Z-BOX Hlavní 123, Brno"
                      className={`w-full ${
                        packetaError
                          ? "border-red-500 ring-2 ring-red-200 focus-visible:ring-red-300"
                          : ""
                      }`}
                    />
                    {packetaError && (
                      <p className="text-xs text-red-500 font-medium">
                        Prosím vyplňte název nebo adresu výdejního místa
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ============= CONTACT DETAILS ============= */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Kontaktní údaje</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Jméno *</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Příjmení *</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Doručovací adresa</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Ulice a číslo popisné *</Label>
                  <Input id="street" name="street" value={formData.street} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Město *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">PSČ *</Label>
                    <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Země</Label>
                  <Input id="country" name="country" value={formData.country} onChange={handleInputChange} disabled />
                </div>
              </div>
            </div>

            {/* ============= NOTE SECTION ============= */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Poznámka k objednávce</h2>
              <div className="space-y-2">
                <Label htmlFor="note">Poznámka (nepovinné)</Label>
                <Textarea
                  id="note"
                  name="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Sem můžete napsat jakoukoliv poznámku k objednávce..."
                  rows={3}
                  className="w-full resize-y"
                />
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Způsob platby</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-4 p-4 rounded-lg border border-primary bg-primary/5 cursor-pointer">
                  <input type="radio" name="payment" value="card" defaultChecked className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">Platba kartou</p>
                    <p className="text-sm text-muted-foreground">Bezpečná platba přes Stripe</p>
                  </div>
                </label>
                {/* Hidden input keeps the payment logic intact */}
                <input type="radio" name="payment" value="transfer" className="hidden" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-6">Vaše objednávka</h2>

              <p className="text-sm text-red-600 text-center min-h-[1.25rem] mb-4">
                {paymentError ?? ""}
              </p>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.customization?.exportData ? (
                      <div className="flex-shrink-0">
                        <StaticSwimwearPreview exportData={item.customization.exportData} size="sm" />
                      </div>
                    ) : (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Vel.: {item.size}</p>
                      {item.customization?.exportData && (
                        <div className="mt-1">
                          <SurchargeList exportData={item.customization.exportData} />
                        </div>
                      )}
                      <p className="text-sm font-medium mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== COUPON CODE SECTION ===== */}
              <div className="border-t border-border pt-4 mb-4">
                <h3 className="text-sm font-semibold mb-3">Slevový kód</h3>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-700">Kód {appliedDiscount.code} uplatněn</p>
                      <p className="text-xs text-green-600">
                        Sleva: {appliedDiscount.discountAmount} Kč
                        {appliedDiscount.discountType === "percentage" && ` (${appliedDiscount.discountValue}%)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Odebrat
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Zadejte kód"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? "..." : "Použít"}
                    </Button>
                  </div>
                )}
                {couponError && !appliedDiscount && (
                  <p className="text-xs text-red-500 mt-1">{couponError}</p>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cena produktů</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      Sleva ({appliedDiscount.code})
                    </span>
                    <span className="text-green-600">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Doprava ({shippingMethod === "ppl" ? "PPL" : shippingMethod === "gls" ? "GLS" : "Zásilkovna"})
                  </span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                  <span>Celková cena</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
                {shippingMethod === "packeta" && packetaAddress && (
                  <div className="text-xs text-muted-foreground pt-1">
                    <p>Doručení na: {packetaAddress}</p>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isPacketaInvalid}>
                {isSubmitting ? "Zpracovávám..." : "Dokončit objednávku"}
              </Button>

              {shippingMethod === "packeta" && isPacketaInvalid && (
                <p className="text-xs text-red-500 text-center mt-2 font-medium">
                  Nejprve vyplňte adresu Zásilkovny výše
                </p>
              )}

              <p className="text-sm text-red-600 text-center mt-3 min-h-[1.25rem]">
                {paymentError ?? ""}
              </p>

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

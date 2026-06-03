"use client"

import { useState } from "react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { use } from "react"
import { Minus, Plus, ShoppingBag, Check } from "lucide-react"
import { getProductById, formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { DragEditor } from "@/components/drag-editor"
import type { DragEditorState } from "@/lib/editor-state"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params)
  const product = getProductById(id)
  const { addToCart } = useCart()
  const [selectedImage, setSelectedImage] = useState<string | null>(
    product?.images && product.images.length > 0 ? product.images[0] : product?.image || null
  )
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [addHeart, setAddHeart] = useState(false)
  const [addPadding, setAddPadding] = useState(false)
  const [customizationPreview, setCustomizationPreview] = useState<{
    previewImage: string | null
    view: "front" | "back"
  } | null>(null)
  const [isAdded, setIsAdded] = useState(false)
  const [dragEditorState, setDragEditorState] = useState<DragEditorState | null>(null)

  if (!product) {
    notFound()
  }

  const handleAddToCart = () => {
    if (!selectedSize) return

    const customization = {
      ...(customizationPreview?.previewImage
        ? { previewImage: customizationPreview.previewImage, view: customizationPreview.view }
        : {}),
      ...(dragEditorState ? { editorState: dragEditorState } : {}),
      ...(addHeart ? { heartBetweenBreasts: true } : {}),
      ...(addPadding ? { padding: true } : {}),
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, Object.keys(customization).length ? customization : undefined)
    }

    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">Domů</a>
        <span className="mx-2">/</span>
        <a href="/kategorie/plavky" className="hover:text-foreground transition-colors">Plavky</a>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div>
          <div className="aspect-square relative overflow-hidden rounded-2xl bg-muted p-4">
            <Image
              src={selectedImage || product.image}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Thumbnails / Gallery placed below the main image */}
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-2 items-center justify-start overflow-x-auto">
              {product.images.map((img) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 p-0 flex-shrink-0 ${
                    selectedImage === img ? "border-primary" : "border-border"
                  }`}
                >
                  <Image src={img} alt="thumb" width={64} height={64} className="object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
              {product.category}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold">
              {formatPrice(product.price)}
            </p>
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Color */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Barva</h3>
            <p className="text-muted-foreground">{product.colors.join(", ")}</p>
          </div>

          {/* Size Selection */}
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3">Velikost</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-12 h-10 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {!selectedSize && (
              <p className="text-sm text-muted-foreground mt-2">
                Vyberte velikost
              </p>
            )}
          </div>

          {/* Extra volby */}
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3">Extra volby</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={addHeart}
                  onChange={(event) => setAddHeart(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-2">
                  <img src="/images/12.png" alt="Srdíčko mezi prsa" width={36} height={36} className="rounded-lg" />
                  <div>
                    <p className="font-medium">Srdíčko mezi prsa</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={addPadding}
                  onChange={(event) => setAddPadding(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-2">
                  <img src="/images/13.png" alt="Vycpávky" width={36} height={36} className="rounded-lg" />
                  <div>
                    <p className="font-medium">Vycpávky</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3">Množství</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="w-full gap-2"
          >
            {isAdded ? (
              <>
                <Check className="h-5 w-5" />
                Přidáno do košíku
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                Přidat do košíku
              </>
            )}
          </Button>

          {/* Product Details */}
        </div>
      </div>

      <DragEditor
        compact
        images={product.images ?? [product.image]}
        onPreviewChange={setCustomizationPreview}
        onEditorStateChange={setDragEditorState}
      />
    </div>
  )
}

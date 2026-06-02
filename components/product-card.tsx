"use client"

import Image from "next/image"
import Link from "next/link"
import { type Product, formatPrice } from "../lib/products"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/produkt/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-xl bg-muted aspect-square relative">
        <Image
          src={product.images && product.images.length > 0 ? product.images[0] : product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  )
}

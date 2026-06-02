import type { Metadata } from "next"
import { products } from "@/lib/products"
import { ProductCard } from "@/components/product-card"

export const metadata: Metadata = {
  title: "Plavky | LaylaStudio",
  description: "Prohlédněte si naši kolekci prémiových plavek. Jednodílné plavky a bikini v různých barvách a velikostech.",
}

export default function CategoryPage() {
  const swimwearProducts = products.filter((p) => p.category === "plavky")

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">Domů</a>
        <span className="mx-2">/</span>
        <span className="text-foreground">Plavky</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Plavky
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Objevte naši kolekci elegantních plavek. Od jednodílných po bikini, 
          každý kousek je vyroben z prémiových materiálů pro maximální pohodlí a styl.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {swimwearProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Product Count */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        Zobrazeno {swimwearProducts.length} produktů
      </div>


    </div>
  )
}

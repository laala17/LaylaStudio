export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  images?: string[]
  category: string
  sizes: string[]
  colors: string[]
  inStock: boolean
  material?: string
  care?: string[]
}

export const products: Product[] = [
  {
    id: "1",
    name: "Bikini set BOBINY BLOSSOM",
    description:
      "Ručně šité bikiny s možností vlastního přizpůsobení. Vyber si velikost a doplňky podle svých představ a vytvoř si jedinečný kousek. ✨",
    price: 790,
    image: "/images/IMG_3096.jpeg",
    images: [
      "/images/IMG_3096.jpeg",
      "/images/IMG_3097.jpeg",
      "/images/IMG_3098.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Růžová"],
    inStock: true,
    material: "Plavky jsou šité z kvalitní sportovní lycry, která se díky své pružnosti dokonale přizpůsobí postavě a poskytuje maximální pohodlí při nošení. Materiál je příjemný na dotek, rychleschnoucí a dlouhodobě si zachovává svůj tvar i vzhled.\n\nSložení: 86 % nylon, 14 % elastan\n\nKaždý kus je ručně šitý a vyráběný na zakázku. Ozdobné detaily se mohou u jednotlivých modelů lišit. Materiál má jemný perleťový lesk, který se může na fotografiích zobrazovat odlišně a nemusí být plně zachycen.",
    care: [
      "Ruční praní ve studené vodě",
      "Nebělit",
      "Nesušit v sušičce",
      "Nežehlit",
    ],
  },
  {
    id: "2",
    name: "Bikini set BOBINY STONE",
    description:
      "Ručně šité bikiny s možností vlastního přizpůsobení. Vyber si velikost a doplňky podle svých představ a vytvoř si jedinečný kousek. ✨",
    price: 790,
    image: "/images/IMG_3091.jpeg",
    images: [
      "/images/IMG_3091.jpeg",
      "/images/IMG_3092.jpeg",
      "/images/IMG_3093.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Šedá"],
    inStock: true,
    material: "Plavky jsou šité z kvalitní sportovní lycry, která se díky své pružnosti dokonale přizpůsobí postavě a poskytuje maximální pohodlí při nošení. Materiál je příjemný na dotek, rychleschnoucí a dlouhodobě si zachovává svůj tvar i vzhled.\n\nSložení: 86 % nylon, 14 % elastan\n\nKaždý kus je ručně šitý a vyráběný na zakázku. Ozdobné detaily se mohou u jednotlivých modelů lišit. Materiál má jemný perleťový lesk, který se může na fotografiích zobrazovat odlišně a nemusí být plně zachycen.",
    care: [
      "Ruční praní ve studené vodě",
      "Nebělit",
      "Nesušit v sušičce",
      "Nežehlit",
    ],
  },
  {
    id: "4",
    name: "Bikini set BOBINY MIDNIGHT",
    description:
      "Ručně šité bikiny s možností vlastního přizpůsobení. Vyber si velikost a doplňky podle svých představ a vytvoř si jedinečný kousek. ✨",
    price: 790,
    image: "/images/IMG_3104.jpeg",
    images: [
      "/images/IMG_3103.jpeg",
      "/images/IMG_3104.jpeg",
      "/images/IMG_3105.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Černá"],
    inStock: true,
    material: "Plavky jsou šité z kvalitní sportovní lycry, která se díky své pružnosti dokonale přizpůsobí postavě a poskytuje maximální pohodlí při nošení. Materiál je příjemný na dotek, rychleschnoucí a dlouhodobě si zachovává svůj tvar i vzhled.\n\nSložení: 86 % nylon, 14 % elastan\n\nKaždý kus je ručně šitý a vyráběný na zakázku. Ozdobné detaily se mohou u jednotlivých modelů lišit. Materiál má jemný perleťový lesk, který se může na fotografiích zobrazovat odlišně a nemusí být plně zachycen.",
    care: [
      "Ruční praní ve studené vodě",
      "Nebělit",
      "Nesušit v sušičce",
      "Nežehlit",
    ],
  },
  {
    id: "5",
    name: "Bikini set BOBINY CLOUD",
    description:
      "Ručně šité bikiny s možností vlastního přizpůsobení. Vyber si velikost a doplňky podle svých představ a vytvoř si jedinečný kousek. ✨",
    price: 790,
    image: "/images/IMG_3100.jpeg",
    images: [
      "/images/IMG_3100.jpeg",
      "/images/IMG_3101.jpeg",
      "/images/IMG_3102.jpeg",
   ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Bílá"],
    inStock: true,
    material: "Plavky jsou šité z kvalitní sportovní lycry, která se díky své pružnosti dokonale přizpůsobí postavě a poskytuje maximální pohodlí při nošení. Materiál je příjemný na dotek, rychleschnoucí a dlouhodobě si zachovává svůj tvar i vzhled.\n\nSložení: 86 % nylon, 14 % elastan\n\nKaždý kus je ručně šitý a vyráběný na zakázku. Ozdobné detaily se mohou u jednotlivých modelů lišit. Materiál má jemný perleťový lesk, který se může na fotografiích zobrazovat odlišně a nemusí být plně zachycen.",
    care: [
      "Ruční praní ve studené vodě",
      "Nebělit",
      "Nesušit v sušičce",
      "Nežehlit",
    
    ],
  },
]
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.category === category)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
  }).format(price)
}

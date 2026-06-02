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
}

export const products: Product[] = [
  {
    id: "1",
    name: "Elegantní jednodílné plavky Coral",
    description:
      "Luxusní jednodílné plavky v teplé korálové barvě. Vyrobeny z prémiového materiálu s UV ochranou.",
    price: 1890,
    image: "/images/IMG_3096.jpeg",
    images: [
      "/images/IMG_3096.jpeg",
      "/images/IMG_3097.jpeg",
      "/images/IMG_3098.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Korálová"],
    inStock: true,
  },
  {
    id: "2",
    name: "Bikini set Navy Blue",
    description:
      "Stylový bikini set v hluboké námořnické modré. Horní díl s měkkou výztuží pro přirozený tvar.",
    price: 1590,
    image: "/images/IMG_3091.jpeg",
    images: [
      "/images/IMG_3091.jpeg",
      "/images/IMG_3092.jpeg",
      "/images/IMG_3093.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Námořnická modrá"],
    inStock: true,
  },
  {
    id: "4",
    name: "Jednodílné plavky Classic Black",
    description:
      "Nadčasové černé jednodílné plavky s jemnými detaily. Klasický elegantní design.",
    price: 2190,
    image: "/images/IMG_3104.jpeg",
    images: [
      "/images/IMG_3103.jpeg",
      "/images/IMG_3104.jpeg",
      "/images/IMG_3105.jpeg",
      "/images/IMG_3106.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Černá"],
    inStock: true,
  },
  {
    id: "5",
    name: "Bikini set Sand Beige",
    description:
      "Trendy bikini v teplé písečné barvě. Minimalistický design pro moderní ženy.",
    price: 1490,
    image: "/images/IMG_3100.jpeg",
    images: [
      "/images/IMG_3100.jpeg",
      "/images/IMG_3101.jpeg",
      "/images/IMG_3102.jpeg",
    ],
    category: "plavky",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Písková béžová"],
    inStock: true,
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

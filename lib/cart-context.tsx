"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "./products"
import type { DragEditorState } from "./editor-state"

export interface CartItem {
  id: string
  product: Product
  quantity: number
  size: string
  customization?: {
    previewImage?: string
    view?: "front" | "back"
    heartBetweenBreasts?: boolean
    padding?: boolean
    editorState?: DragEditorState
  }
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, size: string, customization?: CartItem["customization"]) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch {
        setItems([])
      }
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addToCart = (product: Product, size: string, customization?: CartItem["customization"]) => {
    setItems((currentItems) => {
      if (!customization || Object.keys(customization).length === 0) {
        const existingItem = currentItems.find(
          (item) => item.product.id === product.id && item.size === size && !item.customization
        )

        if (existingItem) {
          return currentItems.map((item) =>
            item.product.id === product.id && item.size === size && !item.customization
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      }

      const cartItem: CartItem = {
        id: `CART-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        product,
        quantity: 1,
        size,
        customization,
      }

      return [...currentItems, cartItem]
    })
  }

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    )
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

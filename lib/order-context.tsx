"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CartItem } from "./cart-context"

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  city: string
  zipCode: string
  country: string
}

export interface Order {
  id: string
  items: CartItem[]
  customer: CustomerInfo
  totalPrice: number
  status: "pending" | "paid" | "shipped" | "delivered"
  createdAt: string
}

interface OrderContextType {
  orders: Order[]
  addOrder: (
    items: CartItem[],
    customer: CustomerInfo,
    totalPrice: number,
    options?: { id?: string; status?: Order["status"]; createdAt?: string }
  ) => Order
  getOrderById: (id: string) => Order | undefined
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window === "undefined") return []
    const savedOrders = localStorage.getItem("orders")
    if (!savedOrders) return []
    try {
      return JSON.parse(savedOrders) as Order[]
    } catch {
      return []
    }
  })
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadOrders = async () => {
      // Fallback: kdyby API z nějakého důvodu nešlo, použijeme localStorage
      const loadFromLocalStorage = () => {
        const savedOrders = localStorage.getItem("orders")
        if (!savedOrders) return []
        try {
          return JSON.parse(savedOrders) as Order[]
        } catch {
          return []
        }
      }

      try {
        const response = await fetch("/api/orders", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`GET /api/orders failed: ${response.status}`)
        }

        const data = (await response.json()) as { orders?: Order[] }
        const apiOrders = Array.isArray(data.orders) ? data.orders : []

        if (!cancelled) setOrders(apiOrders)
      } catch {
        const fallbackOrders = loadFromLocalStorage()
        if (!cancelled) setOrders(fallbackOrders)
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    }

    loadOrders()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("orders", JSON.stringify(orders))
    }
  }, [orders, isHydrated])

  const addOrder = (
    items: CartItem[],
    customer: CustomerInfo,
    totalPrice: number,
    options?: { id?: string; status?: Order["status"]; createdAt?: string }
  ): Order => {
    const newOrder: Order = {
      id: options?.id ?? generateOrderId(),
      items,
      customer,
      totalPrice,
      status: options?.status ?? "pending",
      createdAt: options?.createdAt ?? new Date().toISOString(),
    }

    setOrders((currentOrders) => [...currentOrders, newOrder])
    return newOrder
  }

  const getOrderById = (id: string): Order | undefined => {
    return orders.find((order) => order.id === id)
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder, getOrderById }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
}

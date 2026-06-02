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
  addOrder: (items: CartItem[], customer: CustomerInfo, totalPrice: number) => Order
  getOrderById: (id: string) => Order | undefined
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const savedOrders = localStorage.getItem("orders")
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders))
      } catch {
        setOrders([])
      }
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("orders", JSON.stringify(orders))
    }
  }, [orders, isHydrated])

  const addOrder = (items: CartItem[], customer: CustomerInfo, totalPrice: number): Order => {
    const newOrder: Order = {
      id: generateOrderId(),
      items,
      customer,
      totalPrice,
      status: "pending",
      createdAt: new Date().toISOString(),
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

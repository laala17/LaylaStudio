"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export default function Admin() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verify admin auth by making API call
    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify", { method: "GET" })
        if (!response.ok) {
          router.push("/admin/login")
          return
        }
        setIsAuthenticated(true)
      } catch (err) {
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
        <Button variant="outline" onClick={handleLogout}>
          Odhlásit se
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">Objednávky</h2>
          <p className="text-muted-foreground mb-4">
            Otevři přehled objednávek pro výrobu a konfigurace z editoru.
          </p>
          <Button variant="outline" onClick={() => router.push("/admin/orders")}>
            Přejít na objednávky
          </Button>
        </div>
      </div>
    </div>
  )
}

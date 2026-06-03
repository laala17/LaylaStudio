"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingBag, Menu, ArrowLeft, Clock3 } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const { totalItems } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isHomePage = pathname === "/"

  useEffect(() => {
    let isMounted = true

    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          credentials: "include",
        })

        if (!isMounted) return
        setIsAuthenticated(response.ok)
      } catch {
        if (!isMounted) return
        setIsAuthenticated(false)
      }
    }

    verifyAuth()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Back arrow - shown on all pages except home */}
        {isHomePage ? (
          <div className="w-10" />
        ) : (
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Zpět</span>
          </Button>
        )}

        {/* Hamburger Menu - always visible on the right */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              {isAuthenticated ? (
                <Link
                  href="/order-history"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium transition-colors hover:text-primary flex items-center gap-2"
                >
                  <Clock3 className="h-5 w-5" />
                  Historie objednávek
                </Link>
              ) : null}
              <Link
                href="/kosik"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Košík
                {totalItems > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium transition-colors hover:text-primary"
              >
                Přihlášení
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium transition-colors hover:text-primary"
              >
                Registrace
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

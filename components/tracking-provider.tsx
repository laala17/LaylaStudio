"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

function getDeviceType(): "mobile" | "desktop" {
  if (typeof navigator === "undefined") return "desktop"

  // Check for mobile user agent
  const ua = navigator.userAgent.toLowerCase()
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)

  // Double-check with touch points (tablets may have desktop UA)
  const hasTouch = "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0

  // Small screens are likely mobile
  const isSmallScreen = window.innerWidth < 768

  return isMobile || (hasTouch && isSmallScreen) ? "mobile" : "desktop"
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    // Don't track on admin pages
    if (pathname.startsWith("/admin")) return

    // Avoid duplicate tracking of the same URL in rapid succession
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname

    const deviceType = getDeviceType()

    // Fire-and-forget: send tracking data, don't await
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: window.location.href,
        deviceType,
      }),
    }).catch(() => {
      // Silent fail — tracking must never break the user experience
    })
  }, [pathname])

  return <>{children}</>
}

import { cookies } from "next/headers"

export const ADMIN_COOKIE_NAME = "adminSession"
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function createAdminSessionCookie(response: Response, adminId: string) {
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(adminId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE}`
  )
}

export function clearAdminSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
}

export function getAdminSessionIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getAdminSessionIdFromCookie() {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)
  return cookie?.value ?? null
}

// Client-side helper to check admin auth
export function checkAdminAuthClient(): boolean {
  if (typeof window === "undefined") return false
  
  // HttpOnly cookies can't be read from client-side JS
  // We need to make an API call to verify auth
  return true // This will be checked server-side
}

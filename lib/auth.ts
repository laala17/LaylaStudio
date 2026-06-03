import { cookies } from "next/headers"

export const AUTH_COOKIE_NAME = "authSession"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function createSessionCookie(response: Response, userId: string) {
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
  )
}

export function clearSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
}

export function getSessionIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getSessionIdFromCookie() {
  const cookie = cookies().get(AUTH_COOKIE_NAME)
  return cookie?.value ?? null
}

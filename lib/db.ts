import crypto from "crypto"

export interface User {
  id: string
  email: string
  password: string
  isVerified: boolean
  verificationToken: string | null
  resetPasswordToken: string | null
}

export interface AdminUser {
  id: string
  email: string
  passwordHash: string
}

export const users: User[] = []

// Admin user - stored securely
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

const ADMIN_PASSWORD_HASH = hashPassword("KoleckoAdmin2205")

export const adminUser: AdminUser = {
  id: "admin-001",
  email: "leonazelenakova@seznam.cz",
  passwordHash: ADMIN_PASSWORD_HASH,
}

export function verifyAdminPassword(password: string): boolean {
  const hash = hashPassword(password)
  return hash === adminUser.passwordHash
}

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

export function findUserByVerificationToken(token: string) {
  return users.find((user) => user.verificationToken === token)
}

export function findUserByResetPasswordToken(token: string) {
  return users.find((user) => user.resetPasswordToken === token)
}

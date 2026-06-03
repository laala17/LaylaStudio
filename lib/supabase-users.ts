import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseServer } from "@/lib/supabase-server"
import crypto from "crypto"

type AuthUserRow = {
  id: string
  email: string
  password_hash: string
  is_verified: boolean
  verification_token: string | null
  reset_password_token: string | null
}

const USERS_TABLE = "app_users"

function mustGetClient(): SupabaseClient {
  return getSupabaseServer()
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function findUserByEmail(email: string): Promise<AuthUserRow | null> {
  const supabase = mustGetClient()
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*")
    .ilike("email", email)
    .maybeSingle()

  if (error) throw error
  return (data as AuthUserRow) ?? null
}

export async function findUserByVerificationToken(token: string): Promise<AuthUserRow | null> {
  const supabase = mustGetClient()
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*")
    .eq("verification_token", token)
    .maybeSingle()

  if (error) throw error
  return (data as AuthUserRow) ?? null
}

export async function setUserVerifiedAndClearToken(token: string): Promise<void> {
  const supabase = mustGetClient()
  const { error } = await supabase
    .from(USERS_TABLE)
    .update({ is_verified: true, verification_token: null })
    .eq("verification_token", token)

  if (error) throw error
}

export async function findUserByResetPasswordToken(token: string): Promise<AuthUserRow | null> {
  const supabase = mustGetClient()
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*")
    .eq("reset_password_token", token)
    .maybeSingle()

  if (error) throw error
  return (data as AuthUserRow) ?? null
}

export async function setResetPasswordToken(email: string, resetToken: string): Promise<void> {
  const supabase = mustGetClient()
  const { error } = await supabase
    .from(USERS_TABLE)
    .update({ reset_password_token: resetToken })
    .eq("email", email)

  if (error) throw error
}

export async function clearResetPasswordToken(token: string): Promise<void> {
  const supabase = mustGetClient()
  const { error } = await supabase
    .from(USERS_TABLE)
    .update({ reset_password_token: null })
    .eq("reset_password_token", token)

  if (error) throw error
}

export async function setUserPasswordByResetToken(token: string, newPassword: string): Promise<void> {
  const supabase = mustGetClient()
  const password_hash = hashPassword(newPassword)

  const { error } = await supabase
    .from(USERS_TABLE)
    .update({ password_hash })
    .eq("reset_password_token", token)

  if (error) throw error
}

export async function createUserWithVerification(email: string, password: string, verificationToken: string): Promise<string> {
  const supabase = mustGetClient()
  const password_hash = hashPassword(password)
  const id = crypto.randomUUID()

  const { error } = await supabase.from(USERS_TABLE).insert({
    id,
    email,
    password_hash,
    is_verified: false,
    verification_token: verificationToken,
    reset_password_token: null,
  })

  if (error) throw error
  return id
}

export async function verifyUserPassword(email: string, password: string): Promise<{
  id: string
  isVerified: boolean
}> {
  const user = await findUserByEmail(email)
  if (!user) {
    return { id: "", isVerified: false }
  }

  const password_hash = hashPassword(password)
  if (user.password_hash !== password_hash) {
    return { id: "", isVerified: false }
  }

  return { id: user.id, isVerified: user.is_verified }
}

export async function getUserById(id: string): Promise<AuthUserRow | null> {
  const supabase = mustGetClient()
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data as AuthUserRow) ?? null
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null

function mustGetEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

export function getSupabaseServer(): SupabaseClient {
  if (supabase) return supabase

  // Note: publishable key is not needed for server-side writes (we use service role).
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error("Supabase env missing:", {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    })
    throw new Error("Missing env var: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)")
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error("Supabase service role env missing:", {
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    })
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY")
  }

  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return supabase
}

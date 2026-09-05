import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { env } from "./env"

/**
 * Supabase Admin Client (server-side only, lazy initialization)
 *
 * Uses the secret/service_role key — bypasses Row Level Security.
 * Supports standard Supabase keys and Vercel Supabase Integration environment variables:
 * - SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
 */
let _client: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      const url = env.supabase.url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = env.supabase.serviceRoleKey || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!url || !key) {
        throw new Error(
          `Supabase client not configured. ` +
          `Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) env vars.`
        )
      }

      _client = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }

    return (_client as any)[prop]
  },
})


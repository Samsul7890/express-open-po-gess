import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase Admin Client (server-side only, lazy initialization)
 *
 * Uses the service_role key — bypasses Row Level Security.
 * NEVER expose this key to the frontend.
 *
 * The client is only created on first use. If SUPABASE_URL /
 * SUPABASE_SERVICE_ROLE_KEY are not set (e.g. local Docker with plain
 * Postgres), the app starts fine — it only throws if you actually call
 * supabase.storage / supabase.auth etc.
 */
let _client: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!url || !key) {
        throw new Error(
          `Supabase client not configured. ` +
          `Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars to use Supabase features ` +
          `(Storage, Auth, Realtime). Not needed if you only use Prisma + local Postgres.`
        )
      }

      _client = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }

    return (_client as any)[prop]
  },
})

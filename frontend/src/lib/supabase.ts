import { createClient } from "@supabase/supabase-js"
import { env } from "./env"

const supabaseUrl = env.VITE_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key"

/**
 * Supabase client instance for client-side Auth and Storage access.
 * Uses only public anonymous / publishable key.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

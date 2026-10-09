/**
 * Centralized, type-safe client environment configuration for CreatorBridge.
 *
 * ONLY VITE_ public variables are exposed here.
 * NEVER add server-side secrets (service role keys, API keys, webhook secrets) to this module.
 */

export interface ClientEnv {
  VITE_API_URL: string
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_PUBLISHABLE_KEY: string
  VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: string
  VITE_STRIPE_PUBLISHABLE_KEY: string
  VITE_APP_ENV: string
  VITE_APP_NAME: string
}

// Fallback resolver for Supabase publishable / anon key
const resolvedSupabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""

// Fallback resolver for Cloudflare Turnstile site key
const resolvedTurnstileKey =
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY ||
  import.meta.env.VITE_TURNSTILE_SITE_KEY ||
  ""

function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return ""
  const trimmed = rawUrl.trim()
  if (trimmed.includes("supabase.com/dashboard/project/")) {
    const parts = trimmed.replace(/\/$/, "").split("/")
    const ref = parts[parts.length - 1]
    return `https://${ref}.supabase.co`
  }
  return trimmed
}

export const env: ClientEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL || "/api/v1",
  VITE_SUPABASE_URL: normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || ""),
  VITE_SUPABASE_PUBLISHABLE_KEY: resolvedSupabaseKey,
  VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: resolvedTurnstileKey,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || "development",
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || "CreatorBridge",
}

/**
 * Checks whether Supabase client configuration is provided and valid (non-placeholder).
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(env.VITE_SUPABASE_URL) &&
    !env.VITE_SUPABASE_URL.includes("placeholder") &&
    Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY) &&
    !env.VITE_SUPABASE_PUBLISHABLE_KEY.includes("placeholder")
  )
}

/**
 * Checks whether Turnstile site key is configured (real or Cloudflare test key).
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY)
}

/**
 * Checks whether Stripe publishable key is configured.
 */
export function isStripeConfigured(): boolean {
  return Boolean(env.VITE_STRIPE_PUBLISHABLE_KEY) && env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith("pk_")
}

import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Sparkles, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { TurnstileWidget } from "@/components/common/TurnstileWidget"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Please provide a valid email address.")
      return
    }

    setIsLoading(true)
    try {
      await requestPasswordReset(email, turnstileToken || undefined)
      // Always show success banner to enforce anti-enumeration
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message || "Failed to process password reset. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDFD] dark:bg-[#0F0D15] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center transition-colors duration-200">
      <div className="max-w-md mx-auto w-full">
        {/* Top Header with CreatorBridge Logo and Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <CreatorBridgeLogo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/auth"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#4B4652] dark:text-zinc-400 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-zinc-100 tracking-tight">
            Reset Password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#4B4652] dark:text-zinc-400">
            Enter your account email to receive a secure password recovery link.
          </p>
        </div>

        <div className="rounded-3xl border border-purple-200/80 dark:border-purple-500/20 bg-white/95 dark:bg-[#181524] p-6 sm:p-8 shadow-xl shadow-purple-500/5">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-6">
                If an account exists with <span className="font-semibold text-slate-900 dark:text-zinc-100">{email}</span>, we have sent instructions to reset your password.
              </p>
              <Link
                to="/auth"
                className="inline-flex w-full justify-center rounded-xl bg-purple-600 hover:bg-purple-700 py-3 text-sm font-medium text-white transition-all shadow-md shadow-purple-600/20"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 p-3 flex items-start space-x-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@domain.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#231C35] px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Turnstile verification */}
              <TurnstileWidget
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Sending Request...</span>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          <span>Anti-enumeration protected • Supabase Auth</span>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Sparkles, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { TurnstileWidget } from "@/components/common/TurnstileWidget"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"

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
    <div className="min-h-screen bg-[#FFFDFD] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        {/* Top Header with CreatorBridge Logo */}
        <div className="flex items-center justify-between mb-8">
          <CreatorBridgeLogo size="sm" />
          <Link
            to="/auth"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-[#4B4652] hover:text-[#9A6ADF] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Reset Password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#4B4652]">
            Enter your account email to receive a secure password recovery link.
          </p>
        </div>

        <div className="rounded-3xl border border-purple-200/80 bg-white/95 p-6 sm:p-8 shadow-xl shadow-purple-500/5">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                If an account exists with <span className="font-semibold text-slate-900">{email}</span>, we have sent instructions to reset your password.
              </p>
              <Link
                to="/auth"
                className="inline-flex w-full justify-center rounded-xl bg-purple-600 py-3 text-sm font-medium text-white hover:bg-purple-700 transition-all shadow-md shadow-purple-600/20"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-start space-x-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@domain.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
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
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
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

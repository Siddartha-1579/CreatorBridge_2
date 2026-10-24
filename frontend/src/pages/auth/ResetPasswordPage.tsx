import React, { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Lock, CheckCircle2, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { confirmPasswordReset } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const token = searchParams.get("token") || searchParams.get("access_token") || "mock-recovery-token"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      await confirmPasswordReset(password, token)
      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Recovery link may have expired.")
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
          <ThemeToggle />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-zinc-100 tracking-tight">
            Create New Password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#4B4652] dark:text-zinc-400">
            Please enter a strong new password for your account.
          </p>
        </div>

        <div className="rounded-3xl border border-purple-200/80 dark:border-purple-500/20 bg-white/95 dark:bg-[#181524] p-6 sm:p-8 shadow-xl shadow-purple-500/5">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">Password Updated!</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-6">
                Your password has been changed securely. You can now log into your account with your new credentials.
              </p>
              <Link
                to="/auth"
                className="inline-flex w-full justify-center rounded-xl bg-purple-600 hover:bg-purple-700 py-3 text-sm font-medium text-white transition-all shadow-md shadow-purple-600/20"
              >
                Go to Sign In
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
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#231C35] px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#231C35] px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Set New Password</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          <span>Encrypted with standard PBKDF2 / bcrypt hashing</span>
        </div>
      </div>
    </div>
  )
}

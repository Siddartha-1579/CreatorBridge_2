import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Sparkles, ArrowLeft, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { TurnstileWidget } from "@/components/common/TurnstileWidget"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import type { UserRole } from "@/types"

export const BrandAuthPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [role, setRole] = useState<UserRole>("BRAND")
  const [organizationName, setOrganizationName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === "register") {
      if (!organizationName.trim()) {
        setError("Please enter your company or agency name.")
        return
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
    }

    setIsLoading(true)
    try {
      if (mode === "register") {
        const session = await register({
          email,
          password,
          confirmPassword,
          fullName: organizationName,
          role,
          turnstileToken: turnstileToken || undefined,
        })
        navigate(session.redirectPath || "/brand/onboarding")
      } else {
        const session = await login({
          email,
          password,
          turnstileToken: turnstileToken || undefined,
        })
        navigate(session.redirectPath || "/brand/dashboard")
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDFD] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        {/* Top Header with CreatorBridge Logo */}
        <div className="flex items-center justify-between mb-8">
          <CreatorBridgeLogo size="sm" badgeText="Brand Hub" />
          <Link
            to="/auth"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-[#4B4652] hover:text-[#9A6ADF] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch Portal</span>
          </Link>
        </div>

        {/* Card Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Brand & Agency Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#4B4652]">
            {mode === "login"
              ? "Sign in to publish briefs, review deliverables, and hire creators."
              : "Set up your brand account to hire top AI creators with enterprise guarantees."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100/80 p-1 mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Brand Registration
          </button>
        </div>

        {/* Auth Box */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-slate-500/5">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-start space-x-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("BRAND")}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                        role === "BRAND"
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-semibold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Brand / Enterprise
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("AGENCY")}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                        role === "AGENCY"
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-semibold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Creative Agency
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {role === "AGENCY" ? "Agency Name" : "Company / Brand Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={role === "AGENCY" ? "e.g. Apex Media Agency" : "e.g. Lumina Studios"}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {mode === "login" && (
                  <Link
                    to="/auth/forgot-password"
                    className="text-[11px] font-medium text-purple-600 hover:text-purple-700"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            )}

            {/* Cloudflare Turnstile Human Verification Widget */}
            <TurnstileWidget
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-purple-600 text-white font-medium text-sm shadow-md shadow-slate-900/10 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {mode === "login" ? "Enter Brand Portal" : "Complete Brand Setup"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Creator portal link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">Are you an AI creator looking to bid on briefs? </span>
            <Link
              to="/auth/creator"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Switch to Creator Portal
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          <span>Secured with Supabase Auth & Cloudflare Turnstile bot defense</span>
        </div>
      </div>
    </div>
  )
}

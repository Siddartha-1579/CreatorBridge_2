import React, { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Sparkles, ArrowLeft, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { TurnstileWidget } from "@/components/common/TurnstileWidget"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"

export const CreatorAuthPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
  const [mode, setMode] = useState<"login" | "register">(initialMode)

  useEffect(() => {
    const queryMode = searchParams.get("mode")
    if (queryMode === "register" || queryMode === "login") {
      setMode(queryMode)
    }
  }, [searchParams])

  const [fullName, setFullName] = useState("")
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
      if (!fullName.trim()) {
        setError("Please provide your creator or artist name.")
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
          fullName,
          role: "CREATOR",
          turnstileToken: turnstileToken || undefined,
        })
        navigate(session.redirectPath || "/creator/onboarding")
      } else {
        const session = await login({
          email,
          password,
          turnstileToken: turnstileToken || undefined,
        })
        navigate(session.redirectPath || "/creator/dashboard")
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
          <CreatorBridgeLogo size="sm" badgeText="Creator Hub" />
          <div className="flex items-center space-x-2 text-xs">
            <Link
              to={`/auth/brand${mode === "register" ? "?mode=register" : ""}`}
              className="font-medium text-[#9A6ADF] hover:underline"
            >
              Brand Portal →
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/auth"
              className="inline-flex items-center space-x-1 font-semibold text-[#4B4652] hover:text-[#9A6ADF] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Portals</span>
            </Link>
          </div>
        </div>

        {/* Card Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            AI Creator Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            {mode === "login"
              ? "Welcome back. Access your AI studio, active bids, and portfolio."
              : "Create your creator identity, showcase workflows, and get matched."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100/80 p-1 mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setSearchParams({ mode: "login" })
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setSearchParams({ mode: "register" })
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            New Creator Registration
          </button>
        </div>

        {/* Auth Box */}
        <div className="rounded-3xl border border-purple-200/80 bg-white/95 p-6 sm:p-8 shadow-xl shadow-purple-500/5">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-start space-x-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Creator or Artist Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin (Prompt Artist)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
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
                placeholder="creator@domain.com"
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
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {mode === "login" ? "Enter Creator Studio" : "Complete Creator Registration"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Brand portal link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">Representing a brand or creative agency? </span>
            <Link
              to="/auth/brand"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Switch to Brand Portal
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

import React, { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Sparkles, ArrowLeft, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { authService } from "@/services/auth.service"
import { TurnstileWidget } from "@/components/common/TurnstileWidget"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import type { UserRole } from "@/types"

export const BrandAuthPage: React.FC = () => {
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
          portal: "brand",
        })
        if (session.user.role === "CREATOR") {
          await authService.logout()
          setError("This portal is reserved for Brand and Agency accounts. Creators should log in via the Creator Portal.")
          return
        }
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
          <div className="flex items-center space-x-2 text-xs">
            <Link
              to={`/auth/creator${mode === "register" ? "?mode=register" : ""}`}
              className="font-medium text-[#9A6ADF] hover:underline"
            >
              Creator Portal →
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
            Brand & Agency Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#4B4652]">
            {mode === "login"
              ? "Sign in to publish briefs, review deliverables, and hire creators."
              : "Set up your brand account to hire top AI creators with enterprise guarantees."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#F4E7FF]/50 p-1 mb-4 border border-[#D8B8FF]/60">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setSearchParams({ mode: "login" })
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-[#9A6ADF] shadow-xs"
                : "text-[#4B4652] hover:text-[#111111]"
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
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-[#9A6ADF] shadow-xs"
                : "text-[#4B4652] hover:text-[#111111]"
            }`}
          >
            Brand Registration
          </button>
        </div>

        {/* Demo Brand Quick Login Helper for Live Hackathon Evaluation */}
        {mode === "login" && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#F4E7FF]/40 border border-[#D8B8FF]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A6ADF] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#9A6ADF]" />
                Live Demo Evaluation Accounts
              </span>
              <span className="text-[10px] text-[#9A6ADF]/80 font-medium">1-Click Sign In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setEmail("lumina@demo.creatorbridge.com")
                  setPassword("demo123456")
                  setError(null)
                  setIsLoading(true)
                  try {
                    const session = await login({
                      email: "lumina@demo.creatorbridge.com",
                      password: "demo123456",
                      portal: "brand",
                    })
                    if (session.user.role === "CREATOR") {
                      await authService.logout()
                      setError("This portal is reserved for Brand and Agency accounts. Creators should log in via the Creator Portal.")
                      return
                    }
                    navigate(session.redirectPath || "/brand/dashboard")
                  } catch (err: any) {
                    setError(err?.message || "Demo login failed.")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="py-2 px-3 rounded-xl bg-white border border-[#D8B8FF] text-xs font-semibold text-[#111111] hover:bg-[#9A6ADF] hover:text-white hover:border-[#9A6ADF] transition-all text-left shadow-xs cursor-pointer"
              >
                <div className="font-bold truncate">Lumina Skincare</div>
                <div className="text-[10px] opacity-75 font-normal">Luxury Cosmetics</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEmail("terra@demo.creatorbridge.com")
                  setPassword("demo123456")
                  setError(null)
                  setIsLoading(true)
                  try {
                    const session = await login({
                      email: "terra@demo.creatorbridge.com",
                      password: "demo123456",
                      portal: "brand",
                    })
                    if (session.user.role === "CREATOR") {
                      await authService.logout()
                      setError("This portal is reserved for Brand and Agency accounts. Creators should log in via the Creator Portal.")
                      return
                    }
                    navigate(session.redirectPath || "/brand/dashboard")
                  } catch (err: any) {
                    setError(err?.message || "Demo login failed.")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="py-2 px-3 rounded-xl bg-white border border-[#D8B8FF] text-xs font-semibold text-[#111111] hover:bg-[#9A6ADF] hover:text-white hover:border-[#9A6ADF] transition-all text-left shadow-xs cursor-pointer"
              >
                <div className="font-bold truncate">Terra Outdoor</div>
                <div className="text-[10px] opacity-75 font-normal">Technical Alpine Gear</div>
              </button>
            </div>
          </div>
        )}

        {/* Auth Box */}
        <div className="rounded-3xl border border-[#F4E7FF] bg-white p-6 sm:p-8 shadow-xl shadow-[#9A6ADF]/5">
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
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Organization Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("BRAND")}
                      className={`py-2 px-3 text-xs rounded-xl border transition-all text-center cursor-pointer ${
                        role === "BRAND"
                          ? "border-[#9A6ADF] bg-[#F4E7FF]/60 text-[#9A6ADF] font-bold shadow-2xs"
                          : "border-[#D8B8FF]/60 bg-white text-[#4B4652] hover:bg-[#F4E7FF]/20 hover:border-[#D8B8FF]"
                      }`}
                    >
                      Brand / Enterprise
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("AGENCY")}
                      className={`py-2 px-3 text-xs rounded-xl border transition-all text-center cursor-pointer ${
                        role === "AGENCY"
                          ? "border-[#9A6ADF] bg-[#F4E7FF]/60 text-[#9A6ADF] font-bold shadow-2xs"
                          : "border-[#D8B8FF]/60 bg-white text-[#4B4652] hover:bg-[#F4E7FF]/20 hover:border-[#D8B8FF]"
                      }`}
                    >
                      Creative Agency
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    {role === "AGENCY" ? "Agency Name" : "Company / Brand Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={role === "AGENCY" ? "e.g. Apex Media Agency" : "e.g. Lumina Studios"}
                    className="w-full rounded-xl border border-[#D8B8FF] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#4B4652]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/30 shadow-2xs transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-[#D8B8FF] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#4B4652]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/30 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#111111]">
                  Password
                </label>
                {mode === "login" && (
                  <Link
                    to="/auth/forgot-password"
                    className="text-[11px] font-semibold text-[#9A6ADF] hover:text-[#8655cb]"
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
                  className="w-full rounded-xl border border-[#D8B8FF] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#4B4652]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/30 shadow-2xs transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B4652]/60 hover:text-[#111111] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#D8B8FF] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#4B4652]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/30 shadow-2xs transition-colors"
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
              className="w-full py-3.5 px-4 rounded-xl bg-[#9A6ADF] hover:bg-[#8655cb] text-white font-bold text-sm shadow-md shadow-[#9A6ADF]/25 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
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
          <div className="mt-6 pt-5 border-t border-[#F4E7FF] text-center">
            <span className="text-xs text-[#4B4652]">Are you an AI creator looking to bid on briefs? </span>
            <Link
              to="/auth/creator"
              className="text-xs font-bold text-[#9A6ADF] hover:text-[#8655cb] transition-colors"
            >
              Switch to Creator Portal
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-[#4B4652]/70">
          <ShieldCheck className="h-3.5 w-3.5 text-[#9A6ADF]" />
          <span>Secured with Supabase Auth & Cloudflare Turnstile bot defense</span>
        </div>
      </div>
    </div>
  )
}

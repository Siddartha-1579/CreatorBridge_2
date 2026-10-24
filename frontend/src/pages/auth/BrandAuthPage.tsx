import React, { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Sparkles, ArrowLeft, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { authService } from "@/services/auth.service"
import { TurnstileWidget } from "@/components/common/TurnstileWidget"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { PolicyAgreementCheckbox } from "@/components/policy/PolicyAgreementCheckbox"
import { PlatformPoliciesModal } from "@/components/policy/PlatformPoliciesModal"
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
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyError, setPolicyError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === "register") {
      if (!organizationName.trim()) {
        setError("Please provide your company or agency brand name.")
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
      if (!policyAccepted) {
        setPolicyError(true)
        setError("You must read and agree to the CreatorBridge Platform Policies to create an account.")
        return
      }
    }

    setIsLoading(true)

    try {
      if (mode === "login") {
        const session = await login({
          email,
          password,
          portal: "BRAND",
          turnstileToken: turnstileToken || undefined,
        })
        navigate(session.redirectPath || "/brand/dashboard")
      } else {
        const session = await register({
          email,
          password,
          fullName: organizationName,
          role,
          portal: "BRAND",
          turnstileToken: turnstileToken || undefined,
          policyAccepted: policyAccepted,
          policyVersion: "2026.1",
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
    <div className="min-h-screen bg-[#FFFDFD] dark:bg-[#0F0D15] text-[#111111] dark:text-[#F5F3F8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center transition-colors duration-200">
      <div className="max-w-md mx-auto w-full">
        {/* Top Header with CreatorBridge Logo & Theme Toggle */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#F4E7FF] dark:border-[#2D2447]">
          <CreatorBridgeLogo size="sm" badgeText="Brand Hub" />
          <div className="flex items-center space-x-2 text-xs">
            <ThemeToggle />
            <Link
              to={`/auth/creator${mode === "register" ? "?mode=register" : ""}`}
              className="font-medium text-[#9A6ADF] dark:text-[#B78AF7] hover:underline"
            >
              Creator Portal →
            </Link>
            <span className="text-slate-300 dark:text-[#3E325D]">|</span>
            <Link
              to="/auth"
              className="inline-flex items-center space-x-1 font-semibold text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Portals</span>
            </Link>
          </div>
        </div>

        {/* Card Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-[#F5F3F8] tracking-tight">
            Brand & Agency Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#4B4652] dark:text-[#C7C3D4]">
            {mode === "login"
              ? "Sign in to publish briefs, review deliverables, and hire creators."
              : "Set up your brand account to hire top AI creators with enterprise guarantees."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#F4E7FF]/50 dark:bg-[#181524] p-1 mb-4 border border-[#D8B8FF]/60 dark:border-[#2D2447]">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setSearchParams({ mode: "login" })
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] shadow-xs"
                : "text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#111111] dark:hover:text-[#F5F3F8]"
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
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] shadow-xs"
                : "text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#111111] dark:hover:text-[#F5F3F8]"
            }`}
          >
            Brand Registration
          </button>
        </div>

        {/* Demo Brand Quick Login Helper */}
        {mode === "login" && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#F4E7FF]/40 dark:bg-[#231C35]/60 border border-[#D8B8FF] dark:border-[#3E325D]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A6ADF] dark:text-[#B78AF7] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#9A6ADF] dark:text-[#B78AF7]" />
                Live Demo Evaluation Accounts
              </span>
              <span className="text-[10px] text-[#9A6ADF]/80 dark:text-[#B78AF7]/80 font-medium">1-Click Sign In</span>
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
                    await login({
                      email: "lumina@demo.creatorbridge.com",
                      password: "demo123456",
                      portal: "BRAND",
                    })
                    navigate("/brand/dashboard")
                  } catch (e: any) {
                    setError(e.message || "Failed to login as Lumina Skincare")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="text-left p-2.5 rounded-xl bg-white dark:bg-[#181524] border border-[#D8B8FF]/60 dark:border-[#2D2447] hover:border-[#9A6ADF] dark:hover:border-[#3E325D] hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="font-semibold text-xs text-slate-800 dark:text-[#F5F3F8] group-hover:text-[#9A6ADF] dark:group-hover:text-[#B78AF7]">
                  Lumina Skincare
                </div>
                <div className="text-[10px] text-[#4B4652] dark:text-[#A9A3B8]">DTC Luxury Brand</div>
                <div className="text-[9px] text-[#9A6ADF] dark:text-[#B78AF7] font-mono mt-0.5">2 Published Briefs</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEmail("terra@demo.creatorbridge.com")
                  setPassword("demo123456")
                  setError(null)
                  setIsLoading(true)
                  try {
                    await login({
                      email: "terra@demo.creatorbridge.com",
                      password: "demo123456",
                      portal: "BRAND",
                    })
                    navigate("/brand/dashboard")
                  } catch (e: any) {
                    setError(e.message || "Failed to login as Terra Outdoor")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="text-left p-2.5 rounded-xl bg-white dark:bg-[#181524] border border-[#D8B8FF]/60 dark:border-[#2D2447] hover:border-[#9A6ADF] dark:hover:border-[#3E325D] hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="font-semibold text-xs text-slate-800 dark:text-[#F5F3F8] group-hover:text-[#9A6ADF] dark:group-hover:text-[#B78AF7]">
                  Terra Outdoor
                </div>
                <div className="text-[10px] text-[#4B4652] dark:text-[#A9A3B8]">Adventure Apparel</div>
                <div className="text-[9px] text-[#9A6ADF] dark:text-[#B78AF7] font-mono mt-0.5">2 Active Campaigns</div>
              </button>
            </div>
          </div>
        )}

        {/* Auth Box */}
        <div className="rounded-3xl border border-[#D8B8FF]/70 dark:border-[#2D2447] bg-white dark:bg-[#181524] p-6 sm:p-8 shadow-xl shadow-[#9A6ADF]/5 transition-colors duration-200">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/20 p-3 flex items-start space-x-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-[#111111] dark:text-[#C7C3D4] mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setRole("BRAND")}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === "BRAND"
                        ? "bg-[#F4E7FF] dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] border-[#9A6ADF] dark:border-[#B78AF7]"
                        : "border-slate-200 dark:border-[#2D2447] text-[#4B4652] dark:text-[#C7C3D4] hover:bg-slate-50 dark:hover:bg-[#181524]"
                    }`}
                  >
                    Direct Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("AGENCY")}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === "AGENCY"
                        ? "bg-[#F4E7FF] dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] border-[#9A6ADF] dark:border-[#B78AF7]"
                        : "border-slate-200 dark:border-[#2D2447] text-[#4B4652] dark:text-[#C7C3D4] hover:bg-slate-50 dark:hover:bg-[#181524]"
                    }`}
                  >
                    Creative Agency
                  </button>
                </div>

                <label className="block text-xs font-semibold text-[#111111] dark:text-[#C7C3D4] mb-1">
                  Company or Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Lumina Global, Studio Seven"
                  className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-1 focus:ring-[#9A6ADF]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#111111] dark:text-[#C7C3D4] mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-1 focus:ring-[#9A6ADF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#111111] dark:text-[#C7C3D4]">
                  Password
                </label>
                {mode === "login" && (
                  <Link
                    to="/auth/forgot-password"
                    className="text-[11px] font-medium text-[#9A6ADF] dark:text-[#B78AF7] hover:underline"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-1 focus:ring-[#9A6ADF] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#F5F3F8]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-[#111111] dark:text-[#C7C3D4] mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-[#9A6ADF] focus:outline-none focus:ring-1 focus:ring-[#9A6ADF]"
                />
              </div>
            )}

            {/* Cloudflare Turnstile Human Verification Widget */}
            <TurnstileWidget
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
            />

            {/* Mandatory Platform Policies Agreement Checkbox */}
            {mode === "register" && (
              <PolicyAgreementCheckbox
                id="brand-policy-agreement"
                checked={policyAccepted}
                onChange={(checked) => {
                  setPolicyAccepted(checked)
                  if (checked) setPolicyError(false)
                }}
                onOpenPolicies={() => setShowPolicyModal(true)}
                hasError={policyError}
                errorMessage="You must agree to the CreatorBridge Platform Policies to complete registration."
                policyVersion="2026.1"
              />
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === "register" && !policyAccepted)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#9A6ADF] hover:bg-[#8655cb] text-white font-bold text-sm shadow-md shadow-[#9A6ADF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {mode === "login" ? "Enter Brand Dashboard" : "Complete Brand Registration"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Modal for viewing complete platform policies without losing progress */}
          <PlatformPoliciesModal
            isOpen={showPolicyModal}
            onClose={() => setShowPolicyModal(false)}
            onAcceptAndClose={() => {
              setPolicyAccepted(true)
              setPolicyError(false)
              setShowPolicyModal(false)
            }}
          />
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-[#4B4652] dark:text-[#A9A3B8]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#9A6ADF] dark:text-[#B78AF7]" />
          <span>Enterprise Grade Escrow & Intellectual Property Protections</span>
        </div>
      </div>
    </div>
  )
}

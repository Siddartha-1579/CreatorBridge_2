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
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyError, setPolicyError] = useState(false)
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
      if (!policyAccepted) {
        setPolicyError(true)
        setError("You must read and agree to the CreatorBridge Platform Policies to create an account.")
        return
      }
    }

    setIsLoading(true)

    try {
      if (mode === "login") {
        await login({
          email,
          password,
          portal: "CREATOR",
          turnstileToken: turnstileToken || undefined,
        })
        navigate("/creator/dashboard")
      } else {
        await register({
          email,
          password,
          fullName,
          role: "CREATOR",
          portal: "CREATOR",
          turnstileToken: turnstileToken || undefined,
          policyAccepted: policyAccepted,
          policyVersion: "2026.1",
        })
        navigate("/creator/onboarding")
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
          <CreatorBridgeLogo size="sm" badgeText="Creator Hub" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Homepage</span>
            </Link>
          </div>
        </div>

        {/* Card Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-[#F5F3F8] tracking-tight">
            AI Creator Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-[#C7C3D4]">
            {mode === "login"
              ? "Welcome back. Access your AI studio, active bids, and portfolio."
              : "Create your creator identity, showcase workflows, and get matched."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100/80 dark:bg-[#181524] p-1 mb-6 border border-slate-200 dark:border-[#2D2447]">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setSearchParams({ mode: "login" })
              setError(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white dark:bg-[#231C35] text-purple-700 dark:text-[#B78AF7] shadow-xs"
                : "text-slate-600 dark:text-[#C7C3D4] hover:text-slate-900 dark:hover:text-[#F5F3F8]"
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
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white dark:bg-[#231C35] text-purple-700 dark:text-[#B78AF7] shadow-xs"
                : "text-slate-600 dark:text-[#C7C3D4] hover:text-slate-900 dark:hover:text-[#F5F3F8]"
            }`}
          >
            New Creator Registration
          </button>
        </div>

        {/* Demo Creator Quick Login Helper */}
        {mode === "login" && (
          <div className="mb-6 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-[#231C35]/60 border border-purple-200/80 dark:border-[#3E325D]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-[#B78AF7] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-[#B78AF7]" />
                Live Demo Evaluation Accounts
              </span>
              <span className="text-[10px] text-purple-500 dark:text-[#B78AF7]/80 font-medium">1-Click Sign In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setEmail("elena@demo.creatorbridge.com")
                  setPassword("demo123456")
                  setError(null)
                  setIsLoading(true)
                  try {
                    await login({
                      email: "elena@demo.creatorbridge.com",
                      password: "demo123456",
                      portal: "CREATOR",
                    })
                    navigate("/creator/dashboard")
                  } catch (e: any) {
                    setError(e.message || "Failed to login as Elena")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="text-left p-2.5 rounded-xl bg-white dark:bg-[#181524] border border-purple-100 dark:border-[#2D2447] hover:border-purple-300 dark:hover:border-[#3E325D] hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="font-semibold text-xs text-slate-800 dark:text-[#F5F3F8] group-hover:text-purple-700 dark:group-hover:text-[#B78AF7]">
                  Elena Rostova
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#A9A3B8]">Level 3 Master Studio</div>
                <div className="text-[9px] text-purple-600 dark:text-[#B78AF7] font-mono mt-0.5">Fashion & Luxury</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEmail("marcus@demo.creatorbridge.com")
                  setPassword("demo123456")
                  setError(null)
                  setIsLoading(true)
                  try {
                    await login({
                      email: "marcus@demo.creatorbridge.com",
                      password: "demo123456",
                      portal: "CREATOR",
                    })
                    navigate("/creator/dashboard")
                  } catch (e: any) {
                    setError(e.message || "Failed to login as Marcus")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="text-left p-2.5 rounded-xl bg-white dark:bg-[#181524] border border-purple-100 dark:border-[#2D2447] hover:border-purple-300 dark:hover:border-[#3E325D] hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="font-semibold text-xs text-slate-800 dark:text-[#F5F3F8] group-hover:text-purple-700 dark:group-hover:text-[#B78AF7]">
                  Marcus Vance
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#A9A3B8]">Level 2 Verified Specialist</div>
                <div className="text-[9px] text-purple-600 dark:text-[#B78AF7] font-mono mt-0.5">Action & Sports</div>
              </button>
            </div>
          </div>
        )}

        {/* Auth Box */}
        <div className="rounded-3xl border border-purple-200/80 dark:border-[#2D2447] bg-white/95 dark:bg-[#181524] p-6 sm:p-8 shadow-xl shadow-purple-500/5 transition-colors duration-200">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/20 p-3 flex items-start space-x-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#C7C3D4] mb-1">
                  Creator or Artist Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin (Prompt Artist)"
                  className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#C7C3D4] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@domain.com"
                className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#C7C3D4]">
                  Password
                </label>
                {mode === "login" && (
                  <Link
                    to="/auth/forgot-password"
                    className="text-[11px] font-medium text-purple-600 dark:text-[#B78AF7] hover:text-purple-700 dark:hover:text-[#D8B8FF]"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 pr-10"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#C7C3D4] mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-[#2D2447] bg-white dark:bg-[#0F0D15] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F5F3F8] placeholder:text-slate-400 dark:placeholder:text-[#A9A3B8]/60 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
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
                id="creator-policy-agreement"
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
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 cursor-pointer"
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
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-slate-400 dark:text-[#A9A3B8]">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-[#B78AF7]" />
          <span>Secured with Supabase Auth & Cloudflare Turnstile bot defense</span>
        </div>
      </div>
    </div>
  )
}

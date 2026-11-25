import React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Building2, Wand2, ShieldCheck, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"

export const AuthLandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode")
  const creatorTarget = mode ? `/auth/creator?mode=${mode}` : "/auth/creator"
  const brandTarget = mode ? `/auth/brand?mode=${mode}` : "/auth/brand"

  return (
    <div className="min-h-screen bg-[#FFFDFD] dark:bg-[#0F0D15] text-[#111111] dark:text-[#F5F3F8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full">
        {/* Top Bar with Logo & Theme Toggle */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F4E7FF] dark:border-[#2D2447]">
          <CreatorBridgeLogo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Homepage</span>
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-[#F5F3F8] tracking-tight">
            Select Your Marketplace Portal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#4B4652] dark:text-[#C7C3D4] max-w-xl mx-auto leading-relaxed">
            Choose how you will engage on CreatorBridge. Creators and brands have dedicated workspaces, verification flows, and tooling.
          </p>
        </div>

        {/* Dual Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Creator Portal Card */}
          <div
            onClick={() => navigate(creatorTarget)}
            className="group relative rounded-3xl border-2 border-[#F4E7FF] dark:border-[#2D2447] bg-white dark:bg-[#181524] p-8 shadow-sm hover:border-[#9A6ADF] dark:hover:border-[#B78AF7] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-5 right-5 h-8 w-8 rounded-full bg-[#F4E7FF] dark:bg-[#231C35] flex items-center justify-center text-[#9A6ADF] dark:text-[#B78AF7] group-hover:bg-[#9A6ADF] group-hover:text-white transition-colors">
              <ArrowRight className="h-4 w-4" />
            </div>

            <div>
              <div className="h-14 w-14 rounded-2xl bg-[#F4E7FF] dark:bg-[#231C35] border border-[#D8B8FF] dark:border-[#3E325D] flex items-center justify-center text-[#9A6ADF] dark:text-[#B78AF7] mb-6 group-hover:scale-105 transition-transform">
                <Wand2 className="h-7 w-7" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-[#9A6ADF] dark:text-[#B78AF7] bg-[#F4E7FF] dark:bg-[#231C35] px-2.5 py-1 rounded-full border border-[#D8B8FF] dark:border-[#3E325D]">
                For Artists & Prompt Engineers
              </span>
              <h2 className="text-2xl font-bold text-[#111111] dark:text-[#F5F3F8] mt-3 mb-2">
                Join as an AI Creator
              </h2>
              <p className="text-xs sm:text-sm text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed mb-6">
                Build your verified AI portfolio, document your toolchains (Midjourney, Runway, ComfyUI), and get hired for commercial generative campaigns.
              </p>

              <ul className="space-y-2.5 text-xs text-[#4B4652] dark:text-[#C7C3D4] mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7] flex-shrink-0" />
                  <span>Showcase AI generation workflows & model configs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7] flex-shrink-0" />
                  <span>Verified Creator Level tiers (Explorer to Master)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7] flex-shrink-0" />
                  <span>Direct campaign proposals and escrow milestones</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-3 px-6 rounded-xl bg-[#9A6ADF] hover:bg-[#8552D4] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer">
              <span>Continue to Creator Hub</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Brand & Agency Portal Card */}
          <div
            onClick={() => navigate(brandTarget)}
            className="group relative rounded-3xl border-2 border-[#F4E7FF] dark:border-[#2D2447] bg-white dark:bg-[#181524] p-8 shadow-sm hover:border-[#9A6ADF] dark:hover:border-[#B78AF7] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-5 right-5 h-8 w-8 rounded-full bg-[#F4E7FF] dark:bg-[#231C35] flex items-center justify-center text-[#9A6ADF] dark:text-[#B78AF7] group-hover:bg-[#9A6ADF] group-hover:text-white transition-colors">
              <ArrowRight className="h-4 w-4" />
            </div>

            <div>
              <div className="h-14 w-14 rounded-2xl bg-[#F4E7FF] dark:bg-[#231C35] border border-[#D8B8FF] dark:border-[#3E325D] flex items-center justify-center text-[#9A6ADF] dark:text-[#B78AF7] mb-6 group-hover:scale-105 transition-transform">
                <Building2 className="h-7 w-7" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-[#9A6ADF] dark:text-[#B78AF7] bg-[#F4E7FF] dark:bg-[#231C35] px-2.5 py-1 rounded-full border border-[#D8B8FF] dark:border-[#3E325D]">
                For Brands & Creative Agencies
              </span>
              <h2 className="text-2xl font-bold text-[#111111] dark:text-[#F5F3F8] mt-3 mb-2">
                Join as Brand / Agency
              </h2>
              <p className="text-xs sm:text-sm text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed mb-6">
                Publish multi-modal creative briefs, discover creators by specific model capabilities, and manage studio deliverables under enterprise governance.
              </p>

              <ul className="space-y-2.5 text-xs text-[#4B4652] dark:text-[#C7C3D4] mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7] flex-shrink-0" />
                  <span>AI-assisted creative brief formulation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7] flex-shrink-0" />
                  <span>Explainable creator match scores & tool filtering</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7] flex-shrink-0" />
                  <span>Project workspaces with asset versioning</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-3 px-6 rounded-xl bg-[#9A6ADF] hover:bg-[#8552D4] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer">
              <span>Continue to Brand Hub</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Security & Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#4B4652] dark:text-[#C7C3D4] pt-6 border-t border-[#F4E7FF] dark:border-[#2D2447]">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <ShieldCheck className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7]" />
            <span>Protected by Cloudflare Turnstile & Supabase PostgreSQL RLS</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth/forgot-password" className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors">
              Forgot Password?
            </Link>
            <span>•</span>
            <Link to="/" className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { brandsService } from "@/services/brands.service"
import type { BrandDashboardOverview } from "@/types"
import { AnimatedCreatorShowcase } from "@/components/brand/AnimatedCreatorShowcase"
import { BrandCreatorDiscoveryCarousel } from "@/components/brand/BrandCreatorDiscoveryCarousel"
import { BrandProfileEditModal } from "@/components/brand/BrandProfileEditModal"
import { BrandPreferencesModal } from "@/components/brand/BrandPreferencesModal"
import { BrandVerificationModal } from "@/components/brand/BrandVerificationModal"
import { TrustScoreCard } from "@/components/trust/TrustScoreCard"
import {
  Building2,
  Sparkles,
  FileText,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  ChevronRight,
  Loader2,
  Globe,
  Star,
  Users,
} from "lucide-react"

export const BrandDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [overview, setOverview] = useState<BrandDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

  const loadOverview = async () => {
    try {
      const data = await brandsService.getMyOverview()
      setOverview(data)
    } catch (err) {
      console.error("Failed to load brand dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-xs">Loading brand dashboard...</span>
      </div>
    )
  }

  const profile = overview?.profile
  const preferences = overview?.preferences
  const completeness = overview?.completeness
  const badges = overview?.verification_badges || []
  const verifiedCount = badges.filter((b) => b.status === "VERIFIED").length

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Welcome & Organization Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {profile?.company_name || profile?.companyName || "Organization"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              {profile?.organization_type || "Brand Partner"}
            </span>
            {verifiedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Org
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong className="text-slate-800">{profile?.contact_name || user?.fullName || "Partner"}</strong>. Commission AI campaigns, explore certified creators, and manage creative guidelines.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/brand/briefs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Campaign Brief
          </Link>

          <Link
            to="/brand/discover"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            Discover Creators
          </Link>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Transparent Trust & Demerit Reliability Card */}
      <TrustScoreCard />

      {/* Profile Completeness Banner */}
      {completeness && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Profile Completeness
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                  {completeness.percentage}%
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {completeness.percentage === 100
                  ? "Your organization profile is 100% complete and verified!"
                  : "Complete your profile to attract top-tier AI creators and streamline briefs"}
              </h3>
            </div>

            <button
              onClick={() => setIsPreferencesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 self-start sm:self-auto shrink-0"
            >
              Configure Preferences
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>

          {/* Milestone Checklist snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {completeness.items.slice(0, 5).map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className="truncate font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {completeness.improvement_tips && completeness.improvement_tips.length > 0 && (
            <div className="text-xs text-slate-500 bg-purple-50/40 p-2.5 rounded-xl border border-purple-100/60 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>
                <strong>Next suggestion:</strong> {completeness.improvement_tips[0]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Published Briefs */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Campaign Briefs</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {overview?.active_briefs_count || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Algorithmic matchmaking ready
          </p>
        </div>

        {/* Organization Type */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Primary Sector</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {profile?.primary_industry || profile?.industry || "Technology"}
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            {profile?.team_size || "1-10"} Organization
          </p>
        </div>

        {/* Trust Signals */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Verification</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {verifiedCount} / 4 Verified
          </div>
          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
          >
            Manage Trust Signals
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Creator Discovery */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Creator Pool</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            Vetted Creators
          </div>
          <Link
            to="/brand/discover"
            className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
          >
            Explore AI Artists
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Creative Requirements & Formats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creative Preferences Summary */}
        <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Campaign Creative Preferences
              </h3>
            </div>
            <button
              onClick={() => setIsPreferencesModalOpen(true)}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            >
              Edit Preferences &rarr;
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Preferred Delivery Formats
              </span>
              <div className="flex flex-wrap gap-1.5">
                {preferences?.preferred_formats && preferences.preferred_formats.length > 0 ? (
                  preferences.preferred_formats.map((fmt, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                    >
                      {fmt}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No formats specified yet.</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Target Creative Styles
              </span>
              <div className="flex flex-wrap gap-1.5">
                {preferences?.creative_styles && preferences.creative_styles.length > 0 ? (
                  preferences.creative_styles.map((style, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      {style}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No styles specified yet.</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Commercial Rights</span>
                <strong className="text-slate-900">
                  {preferences?.commercial_rights_required ? "Cleared Commercial Rights" : "Standard"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Engagement Model</span>
                <strong className="text-slate-900">
                  {preferences?.engagement_type || "Campaign basis"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Signals Card */}
        <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Organization Trust Badges
              </h3>
            </div>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            >
              Verify Organization &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  badge.status === "VERIFIED"
                    ? "bg-emerald-50/50 border-emerald-200"
                    : badge.status === "PENDING"
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{badge.label}</span>
                  <span className="text-[11px] text-slate-500">{badge.status.replace("_", " ")}</span>
                </div>
                {badge.status === "VERIFIED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : badge.status === "PENDING" ? (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 italic pt-1">
            Verified organization accounts unlock direct messaging and premier creator availability guarantees.
          </p>
        </div>
      </div>

      {/* APPLE CARDS CAROUSEL: CREATOR DISCOVERY & TALENT SOURCING */}
      <BrandCreatorDiscoveryCarousel />

      {/* SECTION 15: ANIMATED CREATOR SHOWCASE */}
      <AnimatedCreatorShowcase />

      {/* Modals */}
      <BrandProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile || null}
        onProfileUpdated={loadOverview}
      />

      <BrandPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        preferences={preferences || null}
        onPreferencesUpdated={loadOverview}
      />

      <BrandVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        badges={badges}
        onBadgeUpdated={loadOverview}
      />
    </div>
  )
}

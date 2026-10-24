import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { creatorsService } from "@/services/creators.service"
import { portfoliosService } from "@/services/portfolios.service"
import type { CreatorProfileDetail, PortfolioProject } from "@/types"
import { PortfolioProject3DCard } from "@/components/portfolio/PortfolioProject3DCard"
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal"
import { CreatorPortfolioCarousel } from "@/components/portfolio/CreatorPortfolioCarousel"
import { formatCurrency } from "@/lib/currency"
import {
  ShieldCheck,
  Award,
  Sparkles,
  MapPin,
  ExternalLink,
  MessageSquare,
  Send,
  CheckCircle2,
  Layers,
  Wrench,
  Globe,
  Loader2,
  AlertCircle,
  FileText,
  Star,
  Film,
  Info,
  ArrowRight,
} from "lucide-react"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"

export const PublicCreatorProfilePage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>()
  const [profile, setProfile] = useState<CreatorProfileDetail | null>(null)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMediaFilter, setActiveMediaFilter] = useState("ALL")

  useEffect(() => {
    async function loadCreatorData() {
      if (!creatorId) return
      setLoading(true)
      setError(null)
      try {
        const creatorData = await creatorsService.getPublicCreator(creatorId)
        setProfile(creatorData)

        // Load public portfolio projects
        const publicProjects = await portfoliosService.listProjects(creatorData.id, true)
        setProjects(publicProjects)
      } catch (err: any) {
        console.error("Failed to load public creator profile:", err)
        setError(err.message || "Creator not found or profile is private")
      } finally {
        setLoading(false)
      }
    }
    loadCreatorData()
  }, [creatorId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="text-slate-500 font-medium text-sm">Loading creator profile & AI showcases...</span>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Creator Profile Unavailable</h2>
        <p className="text-sm text-slate-500">
          The requested creator could not be found or their profile is set to private.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Return to Marketplace Home
        </Link>
      </div>
    )
  }

  const verifiedBadges = profile.verification_badges?.filter((b) => b.status === "VERIFIED") || []

  const filteredProjects = projects.filter((p) => {
    if (activeMediaFilter === "ALL") return true
    return p.media_type === activeMediaFilter
  })

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 px-4 sm:px-6">
      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-sm relative overflow-hidden space-y-6">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-100/60 via-indigo-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          {/* Creator Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar Pill */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0 border-2 border-white overflow-hidden">
              {profile.avatar_url ? (
                <ImageWithFallback
                  src={profile.avatar_url}
                  fallbackSrc={
                    profile.handle?.includes("elena")
                      ? "/demo-assets/elena-rostova-avatar.svg"
                      : profile.handle?.includes("marcus")
                      ? "/demo-assets/marcus-vance-avatar.svg"
                      : profile.handle?.includes("aaliyah")
                      ? "/demo-assets/aaliyah-chen-avatar.svg"
                      : undefined
                  }
                  alt={profile.full_name}
                  iconType="user"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              ) : (
                profile.full_name?.charAt(0) || "C"
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {profile.full_name}
                </h1>
                <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  @{profile.handle}
                </span>

                {profile.is_verified && (
                  <span
                    title="Platform Verified Creator"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Creator
                  </span>
                )}
              </div>

              {profile.headline && (
                <p className="text-base font-medium text-slate-700 leading-snug">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    {profile.location}
                  </span>
                )}
                {profile.hourly_rate_cents && (
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                    {formatCurrency(profile.hourly_rate_cents, "INR", true)} / hr
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-700 font-medium">
                  <Star className={`w-3.5 h-3.5 ${profile.reputation_score && profile.reputation_score > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                  {profile.reputation_score && profile.reputation_score > 0
                    ? `${Number(profile.reputation_score).toFixed(2)} Rating`
                    : "New Creator — No Reviews Yet"}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 self-stretch sm:self-auto">
            <Link
              to="/creator/campaigns"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all text-center"
            >
              <Send className="w-4 h-4" />
              View Open Campaigns
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors text-center"
            >
              <ArrowRight className="w-4 h-4" />
              Browse More Creators
            </Link>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="pt-2 border-t border-slate-100 text-sm text-slate-600 leading-relaxed max-w-4xl">
            {profile.bio}
          </div>
        )}

        {/* Social Links */}
        {profile.social_links && Object.keys(profile.social_links).length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {profile.social_links.website && (
              <a
                href={profile.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
              </a>
            )}
            {profile.social_links.twitter && (
              <a
                href={profile.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Twitter / X
              </a>
            )}
            {profile.social_links.instagram && (
              <a
                href={profile.social_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
          </div>
        )}
      </div>

      {/* Verified Trust Signals & Badges Strip */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              Verified Marketplace Signals
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Strictly fact-based • Zero fake metrics
          </span>
        </div>

        {/* Trust Statements */}
        <div className="flex flex-wrap gap-2">
          {profile.trust_signals?.map((signal, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {signal}
            </span>
          ))}
        </div>

        {/* Detailed Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
          {profile.verification_badges?.map((badge, idx) => {
            const isVerified = badge.status === "VERIFIED"
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isVerified
                    ? "bg-purple-50/60 border-purple-200"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isVerified
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-900 leading-tight">
                  {badge.label}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    isVerified
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isVerified ? "VERIFIED" : "UNVERIFIED"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grid: AI Capability Breakdown & Certified Toolchain */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capability Dimensions Scores */}
        <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              Assessed AI Capability
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Algorithmic capability dimensions calibrated through adaptive technical questions.
          </p>

          <div className="space-y-3 pt-2">
            {profile.dimension_scores &&
              Object.entries(profile.dimension_scores).map(([dim, score]) => (
                <div key={dim} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{dim}</span>
                    <span className="text-purple-700 font-bold">{Math.round(score)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <span>
              Calibrated at <strong>{profile.level.replace(/_/g, " ")}</strong> level for enterprise brand workflows.
            </span>
          </div>
        </div>

        {/* Toolchain & Specialization */}
        <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs space-y-5 lg:col-span-2">
          {/* Primary Specialization */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Primary Creative Specialization
            </h4>
            <p className="text-base font-bold text-slate-900">
              {profile.primary_specialization || "Generative Commercial Directing"}
            </p>
          </div>

          {/* AI Tools Certified */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Certified AI Toolchain & Platforms
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.ai_tools?.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Creative Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Skills & Disciplines
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Formats & Target Niches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Commercial Delivery Formats
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferred_formats?.map((fmt, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Industry Niches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.target_niches?.map((niche, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                    {niche}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Portfolio Showcases Section */}
      <div className="space-y-8">
        {/* APPLE CARDS CAROUSEL: INTERACTIVE SHOWCASE REEL */}
        {projects.length > 0 && (
          <CreatorPortfolioCarousel
            projects={projects}
            onSelectProject={(p) => {
              setSelectedProject(p)
              setIsDetailOpen(true)
            }}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-purple-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              All Production Assets ({filteredProjects.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by media format to review prompt recipes and technical metadata.
            </p>
          </div>

          {/* Media type filter buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All Media", value: "ALL" },
              { label: "Video", value: "VIDEO" },
              { label: "Image", value: "IMAGE" },
              { label: "Animation", value: "ANIMATION" },
              { label: "Audio", value: "AUDIO" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveMediaFilter(tab.value)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  activeMediaFilter === tab.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-white border border-dashed border-purple-200 space-y-2">
            <Film className="w-10 h-10 text-purple-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900">No public portfolio showcases yet</h3>
            <p className="text-xs text-slate-500">
              This creator has not published any public portfolio projects yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <PortfolioProject3DCard
                key={project.id}
                project={project}
                isOwner={false}
                onSelect={(p) => {
                  setSelectedProject(p)
                  setIsDetailOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedProject(null)
        }}
        isOwner={false}
      />
    </div>
  )
}

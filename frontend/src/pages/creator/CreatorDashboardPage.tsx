import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { creatorsService } from "@/services/creators.service"
import { portfoliosService } from "@/services/portfolios.service"
import { matchingService } from "@/services/matching.service"
import type {
  CreatorProfile,
  PortfolioProject,
  ProfileCompletenessResponse,
  VerificationBadge,
  BriefMatchResult,
} from "@/types"
import { PortfolioProject3DCard } from "@/components/portfolio/PortfolioProject3DCard"
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal"
import { ProjectFormModal } from "@/components/portfolio/ProjectFormModal"
import { VerificationCenterModal } from "@/components/creator/VerificationCenterModal"
import { CreatorActionCarousel } from "@/components/creator/CreatorActionCarousel"
import { TrustScoreCard } from "@/components/trust/TrustScoreCard"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  ShieldCheck,
  Award,
  Star,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Loader2,
  Wrench,
  Layers,
  Target,
} from "lucide-react"

export const CreatorDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [completeness, setCompleteness] = useState<ProfileCompletenessResponse | null>(null)
  const [badges, setBadges] = useState<VerificationBadge[]>([])
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [recommendedBriefs, setRecommendedBriefs] = useState<BriefMatchResult[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Modals state
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [isVerificationCenterOpen, setIsVerificationCenterOpen] = useState(false)

  const loadDashboardData = async () => {
    try {
      const myProfile = await creatorsService.getMyProfile()
      setProfile(myProfile)

      const [compRes, badgeRes, projectRes, recsRes] = await Promise.all([
        creatorsService.getMyCompleteness(),
        creatorsService.getMyVerifications(),
        portfoliosService.listProjects(myProfile.id, false),
        matchingService.getCreatorRecommendations().catch(() => []),
      ])

      setCompleteness(compRes)
      setBadges(badgeRes)
      setProjects(projectRes)
      setRecommendedBriefs(recsRes || [])
    } catch (err) {
      console.error("Failed to load creator dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleProjectSaved = () => {
    loadDashboardData()
  }

  const handleToggleVisibility = async (project: PortfolioProject) => {
    const nextVis = project.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"
    try {
      await portfoliosService.toggleVisibility(project.id, nextVis)
      loadDashboardData()
    } catch (err) {
      console.error("Failed to toggle visibility:", err)
    }
  }

  const handleDeleteProject = async (project: PortfolioProject) => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      try {
        await portfoliosService.deleteProject(project.id)
        loadDashboardData()
      } catch (err) {
        console.error("Failed to delete project:", err)
      }
    }
  }

  const verifiedCount = badges.filter((b) => b.status === "VERIFIED").length

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome & Public Profile Discovery Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Creator Dashboard
            </h1>
            {profile?.assessment_completed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                <Sparkles className="w-3 h-3" />
                Assessed Creator
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong className="text-slate-800">{profile?.full_name || user?.fullName || "Creator"}</strong>. Manage your AI portfolio showcases and brand verification signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {profile && (
            <Link
              to={`/creators/${profile.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Public Profile (What brands see)
            </Link>
          )}

          <button
            onClick={() => {
              setEditingProject(null)
              setIsFormOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Showcase Project
          </button>
        </div>
      </div>

      {/* Transparent Trust & Demerit Reliability Card */}
      <TrustScoreCard />

      {/* Dynamic Profile Completeness Banner */}
      {completeness && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-purple-100 shadow-sm relative overflow-hidden space-y-4">
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
              <h3 className="text-base font-bold text-slate-900">
                {completeness.percentage === 100
                  ? "Your creator marketplace profile is 100% complete!"
                  : "Complete your profile to unlock premium brand campaign briefs"}
              </h3>
            </div>

            <Link
              to="/creator/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 self-start sm:self-auto shrink-0"
            >
              Improve Profile Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>

          {/* Milestone checklist indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {completeness.items.slice(0, 5).map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100"
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

          {/* Actionable improvement tip */}
          {completeness.improvement_tips && completeness.improvement_tips.length > 0 && (
            <div className="text-xs text-slate-500 bg-purple-50/40 p-2.5 rounded-xl border border-purple-100/60 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>
                <strong>Next step:</strong> {completeness.improvement_tips[0]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Creator Level */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Creator Level</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {profile?.level ? profile.level.replace(/_/g, " ") : "EXPLORER"}
          </div>
          <p className="text-[11px] font-medium text-purple-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            Adaptive Assessment Calibrated
          </p>
        </div>

        {/* Reputation Score */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reputation Score</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {profile?.reputation_score && profile.reputation_score > 0
              ? `${Number(profile.reputation_score).toFixed(2)} / 5.0`
              : "New — Unrated"}
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            {profile?.reputation_score && profile.reputation_score > 0
              ? "Factual score derived from completed client contracts"
              : "New creator — insufficient review history"}
          </p>
        </div>

        {/* Portfolio Assets */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Showcase Assets</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {projects.length} Published
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Persistent Object Storage & CDN
          </p>
        </div>

        {/* Verification Status */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Trust Badges</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {verifiedCount} / 6 Verified
          </div>
          <button
            onClick={() => setIsVerificationCenterOpen(true)}
            className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
          >
            Manage Trust Signals
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Verification Trust Signals Strip */}
      <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Verified Marketplace Signals
            </h3>
          </div>
          <button
            onClick={() => setIsVerificationCenterOpen(true)}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            Verification Center &rarr;
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                badge.status === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : badge.status === "PENDING"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {badge.status === "VERIFIED" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-400" />
              )}
              <span>{badge.label}</span>
              <span className="text-[10px] font-bold opacity-75">
                ({badge.status.replace("_", " ")})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* APPLE CARDS CAROUSEL: CREATOR GROWTH & ACTIONABLE WORKFLOWS */}
      <CreatorActionCarousel
        profile={profile}
        completeness={completeness}
        projects={projects}
        onAddProject={() => {
          setEditingProject(null)
          setIsFormOpen(true)
        }}
      />

      {/* MATCHED CAMPAIGN OPPORTUNITIES (AI MATCHING ENGINE INTEGRATION) */}
      {recommendedBriefs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  AI-Matched Brand Opportunities
                </h2>
                <p className="text-xs text-slate-500">
                  Campaign briefs scored in real-time against your verified toolset and specialization.
                </p>
              </div>
            </div>

            <Link
              to="/creator/campaigns"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
            >
              Browse All Briefs &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedBriefs.map((rec) => (
              <div
                key={rec.brief_id}
                className="p-5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 transition-all shadow-2xs hover:shadow-md space-y-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {rec.brand_name || "Verified Brand"} • {rec.category || "Commercial Campaign"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      {rec.brief_title}
                    </h3>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{rec.overall_match_score}% Match</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {rec.summary_explanation}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(rec.required_tools || []).map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100"
                    >
                      {tool}
                    </span>
                  ))}
                  {(rec.platforms || []).map((plat) => (
                    <span
                      key={plat}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                    >
                      {plat}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="font-mono text-slate-700 font-bold">
                    {rec.budget_cents ? `$${(rec.budget_cents / 100).toLocaleString()}` : "Competitive Budget"}
                  </div>
                  <Link to="/creator/studio">
                    <Button variant="primary" size="sm" className="h-7 text-xs gap-1">
                      Prep in Studio <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Showcase Section with 3D Perspective Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              AI Portfolio Showcases
            </h2>
            <p className="text-xs text-slate-500">
              Interactive 3D showcases with documented prompts, toolchains, and commercial clearance.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProject(null)
              setIsFormOpen(true)
            }}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span>Loading showcase assets...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-purple-200 space-y-3">
            <FolderKanban className="w-10 h-10 text-purple-300 mx-auto" />
            <h3 className="font-semibold text-slate-900 text-sm">No portfolio assets added yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first AI video reel, image collection, or concept art showcase to attract high-tier brand briefs.
            </p>
            <button
              onClick={() => {
                setEditingProject(null)
                setIsFormOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload First Showcase
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <PortfolioProject3DCard
                key={project.id}
                project={project}
                isOwner={true}
                onSelect={(p) => {
                  setSelectedProject(p)
                  setIsDetailOpen(true)
                }}
                onEdit={(p) => {
                  setEditingProject(p)
                  setIsFormOpen(true)
                }}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}

        {/* Reviewer & Demo Exploration Strip */}
        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-[#F4E7FF]/40 via-white to-[#FFF4E5]/40 border border-[#D8B8FF] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#9A6ADF] text-white uppercase tracking-wider">
                Demo Exploration
              </span>
              <h3 className="text-sm font-bold text-[#111111]">
                Completed Demo Creator Profiles & Production Portfolios
              </h3>
            </div>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A6ADF] hover:underline"
            >
              Explore Full Roster <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-[#4B4652] leading-relaxed">
            Inspect the 3 benchmark demo creators and 6 rich sample AI portfolios seeded with prompt provenance, model toolchains, and multi-angle workflow stages:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <Link
              to="/creators/00000000-0000-0000-0000-000000000021"
              className="group p-4 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#9A6ADF] hover:shadow-md transition-all space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-100 border border-purple-200 shrink-0">
                  <img
                    src="/demo-assets/elena-rostova-avatar.svg"
                    alt="Elena Rostova"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111111] group-hover:text-[#9A6ADF] transition-colors flex items-center gap-1">
                    Elena Rostova <span className="text-[10px] text-amber-600 font-normal">★ 4.96</span>
                  </h4>
                  <p className="text-[10px] text-[#4B4652]">AI Fashion & Haute Couture</p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                2 Portfolios: Cyber Couture 2026, Ethereal Silk Drapery
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#9A6ADF] font-bold pt-1 border-t border-slate-50">
                <span>View Full Profile & Reels</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/creators/00000000-0000-0000-0000-000000000022"
              className="group p-4 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#9A6ADF] hover:shadow-md transition-all space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-100 border border-purple-200 shrink-0">
                  <img
                    src="/demo-assets/marcus-vance-avatar.svg"
                    alt="Marcus Vance"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111111] group-hover:text-[#9A6ADF] transition-colors flex items-center gap-1">
                    Marcus Vance <span className="text-[10px] text-amber-600 font-normal">★ 4.92</span>
                  </h4>
                  <p className="text-[10px] text-[#4B4652]">Cinematic AI Video & Motion</p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                2 Portfolios: Kinetic Trails 4K, Temporal Flux Vertical Hook
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#9A6ADF] font-bold pt-1 border-t border-slate-50">
                <span>View Full Profile & Reels</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/creators/00000000-0000-0000-0000-000000000023"
              className="group p-4 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#9A6ADF] hover:shadow-md transition-all space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-100 border border-purple-200 shrink-0">
                  <img
                    src="/demo-assets/aaliyah-chen-avatar.svg"
                    alt="Aaliyah Chen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111111] group-hover:text-[#9A6ADF] transition-colors flex items-center gap-1">
                    Aaliyah Chen <span className="text-[10px] text-amber-600 font-normal">★ 4.98</span>
                  </h4>
                  <p className="text-[10px] text-[#4B4652]">3D Packshots & Botanical CGI</p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                2 Portfolios: Botanical Elixir 3D, Zen Matcha Packaging
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#9A6ADF] font-bold pt-1 border-t border-slate-50">
                <span>View Full Profile & Reels</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedProject(null)
        }}
        onEdit={(p) => {
          setEditingProject(p)
          setIsFormOpen(true)
        }}
        isOwner={true}
      />

      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingProject(null)
        }}
        onSave={handleProjectSaved}
        initialProject={editingProject}
      />

      <VerificationCenterModal
        isOpen={isVerificationCenterOpen}
        onClose={() => setIsVerificationCenterOpen(false)}
        badges={badges}
        onBadgeUpdated={loadDashboardData}
      />
    </div>
  )
}

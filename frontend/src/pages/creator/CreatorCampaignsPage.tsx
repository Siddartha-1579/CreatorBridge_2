import React, { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { briefsService } from "@/services/briefs.service"
import { portfoliosService } from "@/services/portfolios.service"
import { creatorsService } from "@/services/creators.service"
import type {
  CampaignBrief,
  CampaignApplication,
  CreatorProfile,
  PortfolioProject,
} from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"
import { briefMatchesTool, getAvailableToolsForBriefs } from "@/lib/toolMatching"
import { formatCurrency, getCurrencySymbol } from "@/lib/currency"
import {
  Megaphone,
  Search,
  Filter,
  Sparkles,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Send,
  Loader2,
  Check,
  ExternalLink,
  Layers,
  Wand2,
  FolderKanban,
  Tag,
  Briefcase,
  Flame,
  TrendingUp,
  Eye,
  Users,
  Video,
  ArrowRight,
  Trophy,
} from "lucide-react"

export const CreatorCampaignsPage: React.FC = () => {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState<CampaignBrief[]>([])
  const [myApplications, setMyApplications] = useState<CampaignApplication[]>([])
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedPlatform, setSelectedPlatform] = useState("ALL")
  const [selectedTool, setSelectedTool] = useState("ALL")
  const [activeTab, setActiveTab] = useState<"DISCOVER" | "APPLIED">("DISCOVER")

  // Campaign Detail Modal State
  const [selectedBrief, setSelectedBrief] = useState<CampaignBrief | null>(null)

  // Application Modal State
  const [applyingBrief, setApplyingBrief] = useState<CampaignBrief | null>(null)
  const [pitch, setPitch] = useState("")
  const [proposedRateUSD, setProposedRateUSD] = useState<number>(0)
  const [estimatedDays, setEstimatedDays] = useState<number>(7)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([])
  const [isSubmittingApp, setIsSubmittingApp] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)
  const [appSuccessMessage, setAppSuccessMessage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [briefsData, myAppsData, myProfile] = await Promise.all([
        briefsService.listBriefs({ limit: 50 }),
        briefsService.listMyApplications().catch(() => []),
        creatorsService.getMyProfile().catch(() => null),
      ])
      setBriefs(briefsData || [])
      setMyApplications(myAppsData || [])
      setProfile(myProfile)

      if (myProfile?.id) {
        const projects = await portfoliosService.listProjects(myProfile.id, false).catch(() => [])
        setPortfolioProjects(projects || [])
      }
    } catch (err) {
      console.error("Failed to load campaign discovery data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Map of briefId -> user's submitted application
  const appliedBriefMap = useMemo(() => {
    const map = new Map<string, CampaignApplication>()
    myApplications.forEach((app) => {
      map.set(app.brief_id, app)
    })
    return map
  }, [myApplications])

  // Featured top campaign for Whop-style hero banner
  const featuredBrief = useMemo(() => {
    if (briefs.length === 0) return null
    return (
      briefs.find((b) => (b.total_pool_cents || 0) > 0 || (b.cpm_rate_cents || 0) > 0) ||
      briefs[0]
    )
  }, [briefs])

  // Trending top 3 campaigns
  const trendingBriefs = useMemo(() => {
    return [...briefs]
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 3)
  }, [briefs])

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    briefs.forEach((b) => {
      if (b.campaign_category) set.add(b.campaign_category)
    })
    return ["ALL", ...Array.from(set)]
  }, [briefs])

  // Unique available AI tools
  const availableTools = useMemo(() => {
    return getAvailableToolsForBriefs(briefs)
  }, [briefs])

  // Filtered briefs
  const filteredBriefs = useMemo(() => {
    return briefs.filter((b) => {
      if (activeTab === "APPLIED") {
        return appliedBriefMap.has(b.id)
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = b.title.toLowerCase().includes(q)
        const matchBrand = (b.brand_or_product_name || "").toLowerCase().includes(q)
        const matchDesc = (b.description || "").toLowerCase().includes(q)
        const matchIdea = (b.campaign_idea || "").toLowerCase().includes(q)
        if (!matchTitle && !matchBrand && !matchDesc && !matchIdea) return false
      }

      // Category filter
      if (selectedCategory !== "ALL" && b.campaign_category !== selectedCategory) {
        return false
      }

      // Platform filter
      if (selectedPlatform !== "ALL") {
        const hasPlatform = b.platforms?.some(
          (p) => p.toUpperCase().includes(selectedPlatform.toUpperCase())
        )
        if (!hasPlatform) return false
      }

      // Tool filter
      if (selectedTool !== "ALL") {
        const hasTool = briefMatchesTool(b, selectedTool)
        if (!hasTool) return false
      }

      return true
    })
  }, [briefs, activeTab, appliedBriefMap, searchQuery, selectedCategory, selectedPlatform, selectedTool])

  const openApplicationModal = (brief: CampaignBrief) => {
    setApplyingBrief(brief)
    setPitch("")
    const defaultProposed = brief.budget_cents
      ? Math.round(brief.budget_cents / 100)
      : (brief.currency === "USD" ? 1000 : 50000)
    setProposedRateUSD(defaultProposed)
    setEstimatedDays(7)
    setSelectedSkills(profile?.skills?.slice(0, 3) || [])
    setSelectedTools(profile?.ai_tools?.slice(0, 3) || [])
    setSelectedPortfolioIds([])
    setAppError(null)
    setAppSuccessMessage(null)
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applyingBrief) return
    if (!pitch.trim() || pitch.trim().length < 20) {
      setAppError("Please provide a pitch or tailored proposal of at least 20 characters.")
      return
    }

    setIsSubmittingApp(true)
    setAppError(null)

    try {
      const createdApp = await briefsService.applyToBrief(applyingBrief.id, {
        pitch: pitch.trim(),
        proposed_rate_cents: proposedRateUSD > 0 ? proposedRateUSD * 100 : undefined,
        estimated_days: estimatedDays > 0 ? estimatedDays : undefined,
        relevant_skills: selectedSkills,
        relevant_tools: selectedTools,
        portfolio_item_ids: selectedPortfolioIds,
      })

      setMyApplications((prev) => [createdApp, ...prev])
      setAppSuccessMessage("Proposal submitted successfully to the brand!")
      setTimeout(() => {
        setApplyingBrief(null)
        setAppSuccessMessage(null)
      }, 1800)
    } catch (err: any) {
      console.error("Failed to submit proposal:", err)
      setAppError(err.message || "Failed to submit proposal.")
    } finally {
      setIsSubmittingApp(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#F4E7FF] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
              Content Rewards Marketplace
            </h1>
            <Badge variant="purple" className="text-xs">
              Live Bounties & CPM Pools
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#4B4652]">
            Discover commercial brand campaigns, get paid per 1,000 verified views, and submit video clips built with your AI toolchains.
          </p>
        </div>

        {/* Tab switch: All Campaigns vs My Proposals */}
        <div className="flex items-center gap-3">
          <Link to="/creator/submissions">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#D8B8FF] text-[#9A6ADF]">
              <Video className="w-3.5 h-3.5" />
              <span>My Submissions</span>
            </Button>
          </Link>
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("DISCOVER")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "DISCOVER"
                  ? "bg-white text-[#9A6ADF] shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Open Campaigns ({briefs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("APPLIED")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "APPLIED"
                  ? "bg-white text-[#9A6ADF] shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Proposals ({myApplications.length})
            </button>
          </div>
        </div>
      </div>

      {/* WHOP-INSPIRED HERO FEATURED BANNER */}
      {activeTab === "DISCOVER" && featuredBrief && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white shadow-xl border border-purple-800/40 p-6 sm:p-8">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#9A6ADF] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  Featured Rewards Pool
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                  {featuredBrief.campaign_category || "Commercial Brand"}
                </span>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-purple-200 font-medium">
                  {featuredBrief.brand_or_product_name || "Verified Brand"}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-tight">
                  {featuredBrief.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl line-clamp-2">
                  {featuredBrief.executive_summary || featuredBrief.campaign_idea || featuredBrief.description}
                </p>
              </div>

              {/* Reward Highlights */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                {featuredBrief.cpm_rate_cents && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-400">
                      {formatCurrency(featuredBrief.cpm_rate_cents, featuredBrief.currency || "INR", true)}
                      <span className="text-xs font-normal text-slate-300"> / 1K Views</span>
                    </p>
                  </div>
                )}

                {featuredBrief.total_pool_cents && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Pool</span>
                    <p className="text-xl sm:text-2xl font-black text-white">
                      {formatCurrency(featuredBrief.total_pool_cents, featuredBrief.currency || "INR", true)}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Creators Active</span>
                  <p className="text-xl sm:text-2xl font-black text-purple-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>{featuredBrief.participants_count || 18}</span>
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link to={`/creator/campaigns/${featuredBrief.id}`}>
                  <Button
                    size="lg"
                    className="bg-[#9A6ADF] hover:bg-[#8552D4] text-white text-xs sm:text-sm font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-purple-900/50 flex items-center gap-2"
                  >
                    <span>View Campaign & Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => openApplicationModal(featuredBrief)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold rounded-xl"
                >
                  Direct Proposal Pitch
                </Button>
              </div>
            </div>

            {/* Right Artwork Preview */}
            <div className="lg:col-span-4 h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden border border-white/20 relative shadow-2xl">
              <ImageWithFallback
                src={featuredBrief.cover_image_url || "/demo-assets/fashion-editorial-cyber.jpg"}
                fallbackSrc="/demo-assets/fashion-editorial-cyber.jpg"
                alt={featuredBrief.title}
                category={featuredBrief.campaign_category}
                iconType="briefcase"
                fallbackText={featuredBrief.title}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div className="text-xs text-white">
                  <span className="font-bold text-purple-300">Accepted AI Tools:</span>{" "}
                  {featuredBrief.required_tools?.slice(0, 3).join(", ") || "Midjourney, Runway Gen-3, Kling"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRENDING THIS WEEK RANKED SECTION */}
      {activeTab === "DISCOVER" && trendingBriefs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">Trending This Week</h2>
              <span className="text-xs text-slate-400 font-normal">Ranked by creator participation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingBriefs.map((trend, idx) => (
              <Link
                key={trend.id}
                to={`/creator/campaigns/${trend.id}`}
                className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#9A6ADF] hover:shadow-xs transition-all"
              >
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    idx === 0
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : idx === 1
                      ? "bg-slate-200 text-slate-700 border border-slate-300"
                      : "bg-orange-100 text-orange-700 border border-orange-200"
                  }`}
                >
                  #{idx + 1}
                </div>

                {/* Thumb */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={trend.cover_image_url || "/demo-assets/fashion-editorial-cyber.jpg"}
                    alt={trend.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#9A6ADF]">
                    {trend.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    {trend.cpm_rate_cents ? (
                      <span className="text-emerald-600 font-bold">
                        {formatCurrency(trend.cpm_rate_cents, trend.currency || "INR", true)} CPM
                      </span>
                    ) : (
                      <span className="text-slate-600 font-semibold">Open Budget</span>
                    )}
                    <span>•</span>
                    <span>{trend.participants_count || 12} joined</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#9A6ADF] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & PLATFORM PILLS BAR */}
      <div className="rounded-2xl border border-[#F4E7FF] bg-white p-4 shadow-2xs space-y-3">
        {/* Top: Platforms Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Platform:</span>
          {["ALL", "TIKTOK", "INSTAGRAM", "YOUTUBE"].map((plat) => {
            const isSelected = selectedPlatform === plat
            return (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#9A6ADF] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {plat === "ALL"
                  ? "All Platforms"
                  : plat === "TIKTOK"
                  ? "TikTok"
                  : plat === "INSTAGRAM"
                  ? "Instagram Reels"
                  : "YouTube Shorts"}
              </button>
            )
          })}
        </div>

        {/* Bottom: Search & Category */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by campaign title, brand, or creative hook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.filter((c) => c !== "ALL").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
            >
              <option value="ALL">All AI Tools</option>
              {availableTools
                .filter((t) => t !== "ALL")
                .map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* CAMPAIGNS GRID */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#9A6ADF]" />
          <p className="text-xs text-slate-500">Loading marketplace campaigns...</p>
        </div>
      ) : filteredBriefs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#F4E7FF] bg-white p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            {activeTab === "APPLIED" ? "No applications submitted yet" : "No matching campaigns found"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "APPLIED"
              ? "Browse open campaigns and submit a proposal with your tailored AI pitch and portfolio samples."
              : "Try adjusting your search query, content format, or category filters to discover more open briefs."}
          </p>
          {activeTab === "APPLIED" ? (
            <Button
              onClick={() => setActiveTab("DISCOVER")}
              className="mt-4 bg-[#9A6ADF] text-white hover:bg-[#8654CF] text-xs"
            >
              Explore Open Campaigns
            </Button>
          ) : (
            (searchQuery || selectedCategory !== "ALL" || selectedPlatform !== "ALL" || selectedTool !== "ALL") && (
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("ALL")
                  setSelectedPlatform("ALL")
                  setSelectedTool("ALL")
                }}
                variant="outline"
                className="mt-4 border-[#F4E7FF] text-[#9A6ADF] hover:bg-[#F4E7FF]/30 text-xs"
              >
                Reset All Filters
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBriefs.map((brief) => {
            const hasApplied = appliedBriefMap.has(brief.id)
            const application = appliedBriefMap.get(brief.id)
            const coverImage =
              brief.cover_image_url ||
              "/demo-assets/skincare-luxury-serum.jpg"
            const cpmRateUSD = brief.cpm_rate_cents ? Math.round(brief.cpm_rate_cents / 100) : null
            const poolUSD = brief.total_pool_cents ? Math.round(brief.total_pool_cents / 100) : null

            return (
              <Card
                key={brief.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#F4E7FF] bg-white shadow-2xs transition-all hover:border-[#D8B8FF] hover:shadow-md"
              >
                {/* Campaign Cover Artwork */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <ImageWithFallback
                    src={coverImage}
                    fallbackSrc="/demo-assets/fashion-editorial-cyber.jpg"
                    alt={brief.title}
                    category={brief.campaign_category}
                    iconType="briefcase"
                    fallbackText={brief.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    containerClassName="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    {brief.campaign_category && (
                      <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white">
                        {brief.campaign_category}
                      </span>
                    )}
                    {brief.cpm_rate_cents && (
                      <span className="rounded-full bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-white">
                        {formatCurrency(brief.cpm_rate_cents, brief.currency || "INR", true)} / 1K Views
                      </span>
                    )}
                  </div>

                  {hasApplied && application && (
                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md shadow-xs ${
                          application.status === "ACCEPTED"
                            ? "bg-emerald-600/90 text-white"
                            : application.status === "SHORTLISTED"
                            ? "bg-purple-600/90 text-white"
                            : application.status === "REJECTED"
                            ? "bg-rose-600/90 text-white"
                            : "bg-amber-500/90 text-white"
                        }`}
                      >
                        ✓ {application.status}
                      </span>
                    </div>
                  )}

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[11px] font-medium text-slate-200">
                      {brief.brand_or_product_name || "Commercial Brand"}
                    </p>
                    <h3 className="text-sm font-bold truncate text-white drop-shadow-sm">
                      {brief.title}
                    </h3>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  {/* Summary / Premise */}
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {brief.executive_summary || brief.campaign_idea || brief.description}
                  </p>

                  {/* Platforms & Tools Pills */}
                  <div className="space-y-2">
                    {brief.platforms && brief.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {brief.platforms.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-md bg-[#F4E7FF]/60 px-2 py-0.5 text-[10px] font-semibold text-[#9A6ADF]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {brief.required_tools && brief.required_tools.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {brief.required_tools.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                          >
                            <Wand2 className="mr-1 h-2.5 w-2.5 text-purple-500" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meta Footer */}
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Pool</span>
                        <p className="font-extrabold text-slate-900">
                          {brief.total_pool_cents ? formatCurrency(brief.total_pool_cents, brief.currency || "INR", true) : "Open Pool"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Participants</span>
                        <p className="font-semibold text-slate-700 flex items-center gap-1 justify-end">
                          <Users className="w-3 h-3 text-[#9A6ADF]" />
                          <span>{brief.participants_count || 12} Creators</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2">
                      <Link to={`/creator/campaigns/${brief.id}`} className="flex-1">
                        <Button
                          variant="primary"
                          className="w-full rounded-xl bg-[#9A6ADF] hover:bg-[#8552D4] text-white text-xs font-bold shadow-xs gap-1"
                        >
                          <span>Join & Submit</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        onClick={() => openApplicationModal(brief)}
                        className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2.5"
                        title="Submit Custom Proposal"
                      >
                        Pitch
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Traditional Pitch Application Modal */}
      <AnimatePresence>
        {applyingBrief && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setApplyingBrief(null)}
                className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="rounded-full bg-[#F4E7FF] px-2.5 py-1 text-[10px] font-bold text-[#9A6ADF]">
                  Proposal Pitch
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Apply to {applyingBrief.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {applyingBrief.brand_or_product_name || "Commercial Brand"} • Target Budget:{" "}
                  {applyingBrief.budget_cents
                    ? formatCurrency(applyingBrief.budget_cents, applyingBrief.currency || "INR", true)
                    : "Negotiable"}
                </p>
              </div>

              {appError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {appError}
                </div>
              )}

              {appSuccessMessage && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  {appSuccessMessage}
                </div>
              )}

              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Creative Angle & Pitch <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Describe how you will execute this brief using generative AI, your aesthetic direction, and past experience..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proposed Rate ({applyingBrief.currency === "USD" ? "USD" : "₹ / INR"})
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={proposedRateUSD}
                      onChange={(e) => setProposedRateUSD(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Est. Turnaround (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setApplyingBrief(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="bg-[#9A6ADF] hover:bg-[#8552D4] text-white text-xs font-bold"
                  >
                    {isSubmittingApp ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Proposal"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default CreatorCampaignsPage

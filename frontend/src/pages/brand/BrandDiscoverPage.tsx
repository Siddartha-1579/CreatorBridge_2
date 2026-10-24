import React, { useState, useEffect, useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { creatorsService } from "@/services/creators.service"
import { matchingService } from "@/services/matching.service"
import { briefsService } from "@/services/briefs.service"
import { projectsService } from "@/services/projects.service"
import type { CreatorProfile, CreatorMatchResult, CampaignBrief } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"
import { creatorMatchesTool, getAvailableToolsForCreators, isToolMatch } from "@/lib/toolMatching"
import { isMatchCompatible, parseMatchScore, formatMatchScore } from "@/lib/matchCompatibility"
import { formatCurrency } from "@/lib/currency"
import {
  Search,
  Sparkles,
  Star,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  X,
  Target,
  DollarSign,
  Clock,
  Layers,
  Heart,
  Palette,
  ShieldCheck,
  ChevronRight,
  Send,
  ExternalLink,
  Briefcase,
  UserCheck,
} from "lucide-react"

interface BrandDiscoverPageProps {
  isPublicView?: boolean
}

export const BrandDiscoverPage: React.FC<BrandDiscoverPageProps> = ({ isPublicView = false }) => {
  const { user, isAuthenticated, isBrand } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const briefIdFromUrl = searchParams.get("briefId")

  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [briefs, setBriefs] = useState<CampaignBrief[]>([])
  const [selectedBriefId, setSelectedBriefId] = useState<string>("general")
  const [matches, setMatches] = useState<CreatorMatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStyle, setSelectedStyle] = useState<string>("all")
  const [selectedTool, setSelectedTool] = useState<string>("all")
  const [minMatchScore, setMinMatchScore] = useState<number>(0)
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(50000)
  const [minRating, setMinRating] = useState<number>(0)
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all")

  // Modals
  const [inspectingMatch, setInspectingMatch] = useState<CreatorMatchResult | null>(null)
  const [invitingCreator, setInvitingCreator] = useState<CreatorProfile | null>(null)
  const [inviteBriefId, setInviteBriefId] = useState<string>("")
  const [inviteMessage, setInviteMessage] = useState<string>("")
  const [inviteSentSuccess, setInviteSentSuccess] = useState<boolean>(false)
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([])

  // Load creators and briefs
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [creatorsList, briefsList] = await Promise.all([
          creatorsService.listCreators(),
          briefsService.listBriefs().catch(() => []),
        ])
        setCreators(creatorsList || [])
        setBriefs(briefsList || [])

        // Initial match computation: respect briefId from URL if present, otherwise default to Global Benchmark ("general")
        const initialBrief = (briefIdFromUrl && briefsList?.find((b) => b.id === briefIdFromUrl)) || null
        const briefIdToUse = initialBrief ? initialBrief.id : "general"
        if (initialBrief) {
          setSelectedBriefId(initialBrief.id)
          setInviteBriefId(initialBrief.id)
        } else {
          setSelectedBriefId("general")
          setInviteBriefId("")
        }

        const matchRes = await matchingService.computeMatches({
          brief_id: briefIdToUse,
          required_tools: initialBrief?.required_tools || [],
          required_skills: initialBrief?.creator_capabilities?.required_capabilities || [],
          target_niches: initialBrief?.creator_capabilities?.preferred_niches || [],
          target_platforms: initialBrief?.platforms || [],
          max_budget_cents: initialBrief?.budget_cents,
        })
        setMatches(matchRes || [])
      } catch (err) {
        console.error("Discovery initialization error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [briefIdFromUrl])

  // Trigger matching engine when active campaign brief changes
  const handleBriefChange = async (briefId: string) => {
    setSelectedBriefId(briefId)
    setInviteBriefId(briefId === "general" ? "" : briefId)
    setRefreshing(true)
    try {
      const activeBrief = briefs.find((b) => b.id === briefId)
      const matchRes = await matchingService.computeMatches({
        brief_id: briefId,
        required_tools: activeBrief?.required_tools || [],
        required_skills: activeBrief?.creator_capabilities?.required_capabilities || [],
        target_niches: activeBrief?.creator_capabilities?.preferred_niches || [],
        target_platforms: activeBrief?.platforms || [],
        max_budget_cents: activeBrief?.budget_cents,
      })
      setMatches(matchRes || [])
    } catch (err) {
      console.error("Failed to recompute matches for brief:", err)
    } finally {
      setRefreshing(false)
    }
  }

  const toggleShortlist = (creatorId: string) => {
    setShortlistedIds((prev) =>
      prev.includes(creatorId) ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
    )
  }

  const handleOpenInvite = (creator: CreatorProfile) => {
    if (!isAuthenticated) {
      navigate("/auth")
      return
    }
    setInvitingCreator(creator)
    setInviteSentSuccess(false)
    setInviteError(null)
    setInviteMessage(`Hi ${creator.full_name || creator.fullName || "there"}, we loved your portfolio on CreatorBridge and would like to invite you to collaborate on our upcoming campaign.`)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitingCreator) return
    setIsSendingInvite(true)
    setInviteError(null)
    try {
      const activeBrief = briefs.find((b) => b.id === (inviteBriefId || selectedBriefId))
      const budgetCents = activeBrief?.budget_cents || 150000
      const title = activeBrief
        ? `${activeBrief.title} × ${invitingCreator.full_name || invitingCreator.fullName || "Creator"}`
        : `Collaboration with ${invitingCreator.full_name || invitingCreator.fullName || "Creator"}`

      await projectsService.createProject({
        title,
        briefId: activeBrief?.id,
        creatorId: invitingCreator.id,
        agreedBudgetCents: budgetCents,
        dueDate: activeBrief?.deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
        milestones: [
          {
            id: `ms_${Date.now()}_1`,
            title: "Concept, Moodboard & Prompt Blueprint",
            amount_cents: Math.round(budgetCents * 0.5),
            status: "PENDING",
          },
          {
            id: `ms_${Date.now()}_2`,
            title: "Final 4K Master Deliverables Acceptance",
            amount_cents: Math.round(budgetCents * 0.5),
            status: "PENDING",
          },
        ],
        deliverables: activeBrief?.deliverables?.map((d) => ({
          id: d.id,
          title: `${d.quantity}x ${d.content_type} (${d.aspect_ratio || "9:16"})`,
          status: "PENDING" as const,
          notes: d.production_notes,
        })) || [
          {
            id: `deliv_${Date.now()}`,
            title: "Master Campaign Deliverable",
            status: "PENDING" as const,
          },
        ],
        messages: inviteMessage.trim()
          ? [
              {
                id: `msg_${Date.now()}`,
                sender_id: user?.id || "brand",
                sender_role: "BRAND",
                content: inviteMessage.trim(),
                timestamp: new Date().toISOString(),
              },
            ]
          : [],
      })

      setInviteSentSuccess(true)
      setTimeout(() => {
        setInvitingCreator(null)
        setInviteSentSuccess(false)
        navigate("/brand/projects")
      }, 1500)
    } catch (err: any) {
      console.error("Failed to create project collaboration:", err)
      setInviteError(err.message || "Failed to create collaboration workspace.")
    } finally {
      setIsSendingInvite(false)
    }
  }

  // Unique available AI tools across creators and standard catalog
  const availableTools = useMemo(() => {
    return getAvailableToolsForCreators(creators)
  }, [creators])

  // Filtered and ranked creator roster
  const filteredCreators = useMemo(() => {
    return creators
      .map((creator) => {
        const matchInfo = matches.find((m) => m.creator_id === creator.id)
        return { creator, matchInfo }
      })
      .filter(({ creator, matchInfo }) => {
        const query = searchQuery.toLowerCase().trim()
        const fullName = (creator.full_name || creator.fullName || "").toLowerCase()
        const handle = (creator.handle || "").toLowerCase()
        const spec = (creator.primary_specialization || creator.primarySpecialization || "").toLowerCase()
        const tools = (creator.ai_tools || creator.aiTools || []).map((t) => t.toLowerCase())
        const skills = (creator.skills || []).map((s) => s.toLowerCase())

        // Search query filter
        const matchesQuery =
          !query ||
          fullName.includes(query) ||
          handle.includes(query) ||
          spec.includes(query) ||
          tools.some((t) => t.includes(query) || isToolMatch(t, query)) ||
          skills.some((s) => s.includes(query))

        // Style / Specialization filter
        const matchesStyle =
          selectedStyle === "all" ||
          spec.includes(selectedStyle.toLowerCase()) ||
          skills.some((s) => s.includes(selectedStyle.toLowerCase()))

        // AI Tool filter
        const matchesTool = creatorMatchesTool(creator, selectedTool)

        // Min match score filter
        const matchesScore = isMatchCompatible(matchInfo?.overall_match_score, minMatchScore)

        // Rate filter (INR)
        const rateRupees = creator.hourly_rate_cents ? creator.hourly_rate_cents / 100 : 2500
        const matchesRate = rateRupees <= maxHourlyRate

        // Rating filter
        const rawRating = creator.reputation_score ?? creator.reputationScore
        const rating = rawRating ? Number(rawRating) : 0
        const matchesRating = minRating === 0 ? true : rating >= minRating

        // Availability filter
        const status = ((creator.metadata as Record<string, any> | undefined)?.availability_status || creator.visibility || "AVAILABLE").toUpperCase()
        const matchesAvailability =
          selectedAvailability === "all" ||
          (selectedAvailability === "available" && status === "AVAILABLE") ||
          (selectedAvailability === "next_week" && (status === "LIMITED" || status === "AVAILABLE"))

        return (
          matchesQuery &&
          matchesStyle &&
          matchesTool &&
          matchesScore &&
          matchesRate &&
          matchesRating &&
          matchesAvailability
        )
      })
      .sort((a, b) => {
        const priorityA = a.matchInfo?.priority_placement ? 1 : 0
        const priorityB = b.matchInfo?.priority_placement ? 1 : 0
        if (priorityA !== priorityB) return priorityB - priorityA
        const trustA = typeof a.matchInfo?.trust_score === "number" ? a.matchInfo.trust_score : -1
        const trustB = typeof b.matchInfo?.trust_score === "number" ? b.matchInfo.trust_score : -1
        if (trustA !== trustB) return trustB - trustA
        const scoreA = parseMatchScore(a.matchInfo?.overall_match_score) ?? -1
        const scoreB = parseMatchScore(b.matchInfo?.overall_match_score) ?? -1
        return scoreB - scoreA
      })
  }, [
    creators,
    matches,
    searchQuery,
    selectedStyle,
    selectedTool,
    minMatchScore,
    maxHourlyRate,
    minRating,
    selectedAvailability,
  ])

  const selectedBrief = briefs.find((b) => b.id === selectedBriefId)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Header & Match Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-[#F4E7FF] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
              Intelligent Talent Discovery
            </span>
            <Badge variant="purple">7-Factor AI Matching</Badge>
            {shortlistedIds.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF4E5] text-[#b46b14] border border-[#FFD7A8]">
                {shortlistedIds.length} Shortlisted
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
            Discover Certified AI Creators
          </h1>
          <p className="text-[#4B4652] text-sm mt-1 max-w-2xl leading-relaxed">
            Search specialized generative artists across 3D, cinematics, VFX, and commercials. Every creator is evaluated with verified AI toolchains and transparent trust metrics.
          </p>
        </div>

        {/* Campaign Brief Match Selector (for authenticated brands) */}
        {isAuthenticated && isBrand && briefs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-[#F4E7FF] p-3 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-xs text-[#111111] font-semibold">
              <Target className="h-4 w-4 text-[#9A6ADF]" />
              <span>Target Brief:</span>
            </div>

            <select
              value={selectedBriefId}
              onChange={(e) => handleBriefChange(e.target.value)}
              className="bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-3 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="general">Global Benchmark (General Discovery)</option>
              {briefs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.budget_cents ? `(${formatCurrency(b.budget_cents, b.currency || "INR", true)})` : ""}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBriefChange(selectedBriefId)}
              disabled={refreshing}
              className="text-xs gap-1.5 h-8 text-[#4B4652] hover:text-[#9A6ADF]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#9A6ADF]" : ""}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Selected Campaign Brief Insights Banner */}
      {selectedBrief && isAuthenticated && isBrand && (
        <div className="p-4 rounded-2xl bg-[#F4E7FF]/50 border border-[#D8B8FF] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#9A6ADF]">Active Campaign Calibration:</span>
              <span className="text-xs font-bold text-[#111111]">{selectedBrief.title}</span>
              <Badge variant="outline" className="text-[10px] bg-white">
                {selectedBrief.campaign_category || "Commercial"}
              </Badge>
            </div>
            <p className="text-xs text-[#4B4652] line-clamp-1">
              Required AI Tools: {selectedBrief.required_tools?.join(", ") || "Generative Suite"} • Platforms:{" "}
              {selectedBrief.platforms?.join(", ") || "Vertical Video"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {selectedBrief.budget_cents && (
              <span className="px-3 py-1 rounded-lg bg-white border border-[#D8B8FF] text-emerald-700 font-mono font-bold">
                Budget: {formatCurrency(selectedBrief.budget_cents, selectedBrief.currency || "INR", true)}
              </span>
            )}
            <Link to={`/brand/briefs/${selectedBrief.id}`}>
              <Button variant="outline" size="sm" className="text-xs h-7 bg-white">
                View Brief
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#F4E7FF] p-4 sm:p-5 rounded-2xl shadow-xs space-y-4">
        {/* Row 1: Search Query */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B4652]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators by name, handle, style (e.g. 3D, VFX), or certified tools..."
            className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111111] placeholder:text-[#4B4652]/60 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40 shadow-2xs"
          />
        </div>

        {/* Row 2: Comprehensive Multi-Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Style / Specialization Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#4B4652] uppercase mb-1">
              Creative Style
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="all">All Styles</option>
              <option value="cinematic">Cinematic Commercials</option>
              <option value="3d">3D & CGI Motion</option>
              <option value="vfx">VFX & Compositing</option>
              <option value="photorealism">Hyper-Realistic</option>
              <option value="fashion">Fashion & Editorial</option>
              <option value="product">Product Visualization</option>
            </select>
          </div>

          {/* 2. AI Tool Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#4B4652] uppercase mb-1">
              Certified AI Tool
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="all">All AI Tools</option>
              {availableTools
                .filter((t) => t.toLowerCase() !== "all")
                .map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
            </select>
          </div>

          {/* 3. Minimum Match Score */}
          <div>
            <label className="block text-[10px] font-bold text-[#4B4652] uppercase mb-1">
              Match Compatibility
            </label>
            <select
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="0">All Match Scores</option>
              <option value="75">Good Match (75%+)</option>
              <option value="85">High Affinity (85%+)</option>
              <option value="90">Top Tier (90%+)</option>
            </select>
          </div>

          {/* 4. Availability Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#4B4652] uppercase mb-1">
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="all">Any Availability</option>
              <option value="available">Available Now</option>
              <option value="next_week">Next 1-2 Weeks</option>
            </select>
          </div>

          {/* 5. Rating Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#4B4652] uppercase mb-1">
              Min Reputation
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="0">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Top Rated</option>
            </select>
          </div>

          {/* 6. Max Hourly Rate */}
          <div>
            <label className="block text-[10px] font-bold text-[#4B4652] uppercase mb-1">
              Max Rate ({maxHourlyRate >= 50000 ? "Any" : `₹${maxHourlyRate.toLocaleString()}/hr`})
            </label>
            <select
              value={maxHourlyRate}
              onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
              className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
            >
              <option value="50000">Any Rate</option>
              <option value="3000">Under ₹3,000/hr</option>
              <option value="7500">Under ₹7,500/hr</option>
              <option value="15000">Under ₹15,000/hr</option>
            </select>
          </div>
        </div>
      </div>

      {/* Creator Roster Grid */}
      {loading ? (
        <div className="py-24 text-center text-[#4B4652] text-sm space-y-3">
          <div className="h-8 w-8 border-3 border-[#9A6ADF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-[#111111]">Running 7-factor explainable matching engine...</p>
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-dashed border-[#D8B8FF] p-8 space-y-3">
          <SlidersHorizontal className="h-10 w-10 mx-auto text-[#9A6ADF] opacity-60 mb-2" />
          <h3 className="text-base font-bold text-[#111111]">No creators match your filter criteria</h3>
          <p className="text-xs text-[#4B4652] max-w-sm mx-auto">
            Try resetting your filters or adjusting your minimum match threshold to discover additional talent.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setSelectedStyle("all")
              setSelectedTool("all")
              setMinMatchScore(0)
              setMaxHourlyRate(50000)
              setMinRating(0)
              setSelectedAvailability("all")
            }}
            className="text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map(({ creator, matchInfo }) => {
            const overallScore = parseMatchScore(matchInfo?.overall_match_score)
            const isHighMatch = overallScore !== null && overallScore >= 85
            const isMediumMatch = overallScore !== null && overallScore >= 70 && overallScore < 85
            const isShortlisted = shortlistedIds.includes(creator.id)

            return (
              <Card
                key={creator.id}
                className="flex flex-col justify-between hover:border-[#D8B8FF] hover:shadow-md transition-all group bg-white border border-[#F4E7FF]"
              >
                <div>
                  <CardHeader className="space-y-3 pb-3">
                    {/* Top Row: Tier Pill + AI Match Score + Shortlist Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="purple" className="text-[11px] font-semibold">
                          {(creator.level || "PRO_CREATOR").replace(/_/g, " ")}
                        </Badge>
                        {matchInfo?.priority_placement && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Priority placement</Badge>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {matchInfo && overallScore !== null && (
                          <button
                            type="button"
                            onClick={() => setInspectingMatch(matchInfo)}
                            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              isHighMatch
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                : isMediumMatch
                                ? "bg-[#F4E7FF] text-[#9A6ADF] border-[#D8B8FF] hover:bg-[#F4E7FF]/80"
                                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                            }`}
                            title="Click to view full 7-factor explainable breakdown"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>{formatMatchScore(overallScore)} Match</span>
                            <ChevronRight className="h-3 w-3 opacity-60" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleShortlist(creator.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isShortlisted
                              ? "bg-rose-50 text-rose-600 border-rose-200"
                              : "bg-white text-[#4B4652] border-[#F4E7FF] hover:text-rose-500"
                          }`}
                          title={isShortlisted ? "Remove from shortlist" : "Save to shortlist"}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isShortlisted ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Creator Identity with Avatar */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-100 border border-purple-200 shrink-0">
                        <ImageWithFallback
                          src={creator.avatar_url || creator.avatarUrl}
                          fallbackSrc={
                            creator.handle?.includes("elena")
                              ? "/demo-assets/elena-rostova-avatar.svg"
                              : creator.handle?.includes("marcus")
                              ? "/demo-assets/marcus-vance-avatar.svg"
                              : creator.handle?.includes("aaliyah")
                              ? "/demo-assets/aaliyah-chen-avatar.svg"
                              : undefined
                          }
                          alt={creator.full_name || "Creator Avatar"}
                          iconType="user"
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CardTitle className="text-base font-bold text-[#111111] group-hover:text-[#9A6ADF] transition-colors">
                            {creator.full_name || creator.fullName || "AI Creator"}
                          </CardTitle>
                          {creator.is_verified && (
                            <span title="Certified Platform Creator">
                              <ShieldCheck className="h-4 w-4 text-[#9A6ADF]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4B4652] font-mono">@{creator.handle}</p>
                      </div>
                    </div>

                    <CardDescription className="text-xs line-clamp-2 text-[#4B4652]">
                      {creator.bio ||
                        creator.primary_specialization ||
                        creator.primarySpecialization ||
                        "Specialized in generative commercials and visual effects."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1 pb-4">
                    {/* Certified AI Tools */}
                    <div>
                      <p className="text-[10px] font-bold text-[#4B4652] uppercase tracking-wider mb-1.5">
                        Certified Toolchain
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(creator.ai_tools || creator.aiTools || []).slice(0, 4).map((tool: string) => (
                          <span
                            key={tool}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4E7FF]/50 border border-[#D8B8FF]/60 text-[#111111] font-medium"
                          >
                            {tool}
                          </span>
                        ))}
                        {(creator.ai_tools || creator.aiTools || []).length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-[#4B4652]">
                            +{(creator.ai_tools || creator.aiTools || []).length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Specialization Tags */}
                    {creator.skills && creator.skills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#4B4652] uppercase tracking-wider mb-1">
                          Verified Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {creator.skills.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-[#4B4652]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Match Factor Pill */}
                    {matchInfo && (
                      <div className="p-3 rounded-xl bg-[#F4E7FF]/40 border border-[#D8B8FF]/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#9A6ADF]">
                          <span>Explainable Match</span>
                          <span
                            className="text-[#9A6ADF] hover:underline cursor-pointer"
                            onClick={() => setInspectingMatch(matchInfo)}
                          >
                            View Criteria
                          </span>
                        </div>
                        <p className="text-xs text-[#4B4652] line-clamp-2 leading-relaxed">
                          {matchInfo.summary_explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer with Rate, Reputation, Trust, and Actions */}
                <CardFooter className="pt-3 border-t border-[#F4E7FF] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-bold">
                      {creator.reputation_score && Number(creator.reputation_score) > 0 ? (
                        <>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span className="text-amber-600 font-semibold">{Number(creator.reputation_score).toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-slate-400 font-normal">New</span>
                        </>
                      )}
                    </div>
                    {matchInfo && (
                      <span className="text-[11px] text-violet-700 font-semibold" title="Trust score is independent of points spent">
                        Trust {typeof matchInfo.trust_score === "number" ? `${matchInfo.trust_score}/100` : "Unknown"}
                      </span>
                    )}
                    {creator.hourly_rate_cents && (
                      <span className="text-[#111111] font-mono font-semibold">
                        {formatCurrency(creator.hourly_rate_cents, "INR", true)}/hr
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPublicView && (
                      <button
                        type="button"
                        onClick={() => handleOpenInvite(creator)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9A6ADF] bg-[#F4E7FF] hover:bg-[#F4E7FF]/80 border border-[#D8B8FF] transition-colors cursor-pointer"
                      >
                        Invite
                      </button>
                    )}
                    <Link to={`/creators/${creator.id}`}>
                      <Button variant="primary" size="sm" className="text-xs h-8">
                        View Portfolios
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Explainable 7-Factor Match Score Drawer Modal */}
      <AnimatePresence>
        {inspectingMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-white border border-[#F4E7FF] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#F4E7FF] flex items-center justify-between bg-[#F4E7FF]/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#9A6ADF] uppercase tracking-wider">
                      Explainable AI Match Report
                    </span>
                    <Badge variant="purple">
                      {formatMatchScore(inspectingMatch.overall_match_score) || `${inspectingMatch.overall_match_score}%`} Affinity
                    </Badge>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111111]">
                    Candidate: @{inspectingMatch.creator_handle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingMatch(null)}
                  className="p-2 rounded-xl bg-white border border-[#D8B8FF] text-[#4B4652] hover:text-[#111111] hover:bg-[#F4E7FF]/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Executive Summary */}
                <div className="p-4 rounded-2xl bg-[#F4E7FF]/50 border border-[#D8B8FF] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#9A6ADF] uppercase tracking-wider">
                    Executive Match Analysis
                  </span>
                  <p className="text-xs text-[#111111] leading-relaxed">
                    {inspectingMatch.summary_explanation}
                  </p>
                </div>

                {/* The 7 Weighted Criteria Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                      7-Factor Criteria Scorecard
                    </h4>
                    <span className="text-[11px] text-[#4B4652] font-mono">100% Normalized Weight</span>
                  </div>

                  <div className="space-y-3">
                    {inspectingMatch.factors.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white border border-[#F4E7FF] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#111111]">{f.factor_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F4E7FF] text-[#9A6ADF] font-mono font-semibold">
                              {(f.weight * 100).toFixed(0)}% Weight
                            </span>
                            <span className="font-bold text-emerald-700 font-mono">{f.score}%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              f.score >= 80 ? "bg-emerald-500" : f.score >= 65 ? "bg-[#9A6ADF]" : "bg-amber-500"
                            }`}
                            style={{ width: `${f.score}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-[#4B4652] leading-normal">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Considerations */}
                {(inspectingMatch.top_strengths?.length || inspectingMatch.potential_gaps?.length) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inspectingMatch.top_strengths && inspectingMatch.top_strengths.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Key Strengths
                        </span>
                        <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                          {inspectingMatch.top_strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {inspectingMatch.potential_gaps && inspectingMatch.potential_gaps.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-600" /> Considerations
                        </span>
                        <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                          {inspectingMatch.potential_gaps.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#F4E7FF] bg-white flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setInspectingMatch(null)}>
                  Close
                </Button>
                <Link to={`/creators/${inspectingMatch.creator_id}`}>
                  <Button variant="primary" size="sm" className="gap-1.5">
                    View Verified Profile <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite to Campaign Brief Modal */}
      <AnimatePresence>
        {invitingCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-[#F4E7FF] rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F4E7FF] pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#9A6ADF]" />
                  <h3 className="text-base font-bold text-[#111111]">
                    Invite {invitingCreator.full_name || "Creator"} to Brief
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInvitingCreator(null)}
                  className="p-1 rounded-lg text-[#4B4652] hover:text-[#111111]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {inviteSentSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-[#111111]">Invitation Sent!</h4>
                  <p className="text-xs text-[#4B4652]">
                    The creator has been notified and can submit a proposal directly to your campaign.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1">
                      Select Target Brief
                    </label>
                    <select
                      value={inviteBriefId}
                      onChange={(e) => setInviteBriefId(e.target.value)}
                      className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl px-3 py-2 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
                    >
                      {briefs.length > 0 ? (
                        briefs.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} {b.budget_cents ? `(${formatCurrency(b.budget_cents, b.currency || "INR", true)})` : ""}
                          </option>
                        ))
                      ) : (
                        <option value="new">Direct Creative Commission (General)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1">
                      Personalized Message
                    </label>
                    <textarea
                      rows={4}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      className="w-full bg-[#FFFDFD] border border-[#D8B8FF] rounded-xl p-3 text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
                    />
                  </div>

                  {inviteError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {inviteError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4E7FF]">
                    <Button variant="outline" size="sm" type="button" onClick={() => setInvitingCreator(null)} disabled={isSendingInvite}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isSendingInvite} className="gap-1.5">
                      {isSendingInvite ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending Invitation...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send Campaign Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

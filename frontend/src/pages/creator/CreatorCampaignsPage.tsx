import React, { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"

export const CreatorCampaignsPage: React.FC = () => {
  const [briefs, setBriefs] = useState<CampaignBrief[]>([])
  const [myApplications, setMyApplications] = useState<CampaignApplication[]>([])
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedContentType, setSelectedContentType] = useState("ALL")
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

  // Unique categories, content types, and tools from published briefs
  const categories = useMemo(() => {
    const set = new Set<string>()
    briefs.forEach((b) => {
      if (b.campaign_category) set.add(b.campaign_category)
    })
    return ["ALL", ...Array.from(set)]
  }, [briefs])

  const contentTypes = useMemo(() => {
    const set = new Set<string>()
    briefs.forEach((b) => {
      b.deliverables?.forEach((d) => {
        if (d.content_type) set.add(d.content_type)
      })
    })
    return ["ALL", ...Array.from(set)]
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

      // Content type filter
      if (selectedContentType !== "ALL") {
        const hasContentType = b.deliverables?.some((d) => d.content_type === selectedContentType)
        if (!hasContentType) return false
      }

      // Tool filter
      if (selectedTool !== "ALL") {
        const hasTool = b.required_tools?.includes(selectedTool)
        if (!hasTool) return false
      }

      return true
    })
  }, [briefs, activeTab, appliedBriefMap, searchQuery, selectedCategory, selectedContentType, selectedTool])

  const openApplicationModal = (brief: CampaignBrief) => {
    setApplyingBrief(brief)
    setPitch("")
    setProposedRateUSD(brief.budget_cents ? Math.round(brief.budget_cents / 100) : 1000)
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#F4E7FF] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
              Campaign Opportunities
            </h1>
            <span className="rounded-full bg-[#F4E7FF] px-2.5 py-0.5 text-xs font-semibold text-[#9A6ADF]">
              Live Marketplace
            </span>
          </div>
          <p className="mt-1 text-xs text-[#4B4652]">
            Browse commercial campaign briefs published by verified brands. Apply with your AI production stack.
          </p>
        </div>

        {/* Tab switch: All Campaigns vs My Proposals */}
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

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#F4E7FF] bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* Keyword Search */}
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

          {/* Category Dropdown */}
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

          {/* Content Type Dropdown */}
          <div>
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Content Types</option>
              {contentTypes.filter((ct) => ct !== "ALL").map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Listing Grid */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#9A6ADF]" />
          <p className="text-xs text-slate-500">Loading marketplace campaign briefs...</p>
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
          {activeTab === "APPLIED" && (
            <Button
              onClick={() => setActiveTab("DISCOVER")}
              className="mt-4 bg-[#9A6ADF] text-white hover:bg-[#8654CF] text-xs"
            >
              Explore Open Campaigns
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBriefs.map((brief) => {
            const hasApplied = appliedBriefMap.has(brief.id)
            const application = appliedBriefMap.get(brief.id)
            const coverImage =
              brief.cover_image_url ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            const budgetUSD = brief.budget_cents ? Math.round(brief.budget_cents / 100) : null

            return (
              <Card
                key={brief.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#F4E7FF] bg-white shadow-2xs transition-all hover:border-[#D8B8FF] hover:shadow-md"
              >
                {/* Campaign Cover Artwork */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={coverImage}
                    alt={brief.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    {brief.campaign_category && (
                      <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white">
                        {brief.campaign_category}
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

                  {/* Deliverables and Required Tools tags */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {brief.deliverables?.slice(0, 2).map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md bg-[#F4E7FF]/60 px-2 py-0.5 text-[10px] font-semibold text-[#9A6ADF]"
                        >
                          <Layers className="mr-1 h-2.5 w-2.5" />
                          {d.quantity}x {d.content_type}
                        </span>
                      ))}
                      {(brief.deliverables?.length || 0) > 2 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          +{brief.deliverables.length - 2} more
                        </span>
                      )}
                    </div>

                    {brief.required_tools && brief.required_tools.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {brief.required_tools.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
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
                        <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
                        <p className="font-extrabold text-slate-900">
                          {budgetUSD ? `$${budgetUSD.toLocaleString()} USD` : "Open to Bids"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Deadline</span>
                        <p className="font-medium text-slate-700">
                          {brief.deadline
                            ? new Date(brief.deadline).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "Flexible"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBrief(brief)}
                        className="flex-1 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Inspect Brief
                      </Button>

                      {hasApplied ? (
                        <Button
                          disabled
                          className="flex-1 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold"
                        >
                          Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={() => openApplicationModal(brief)}
                          className="flex-1 rounded-xl bg-[#9A6ADF] text-white hover:bg-[#8654CF] text-xs font-bold shadow-xs"
                        >
                          Submit Pitch
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Brief Detail Modal */}
      <AnimatePresence>
        {selectedBrief && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setSelectedBrief(null)}
                className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Cover Artwork Hero */}
              {selectedBrief.cover_image_url && (
                <div className="mb-6 h-48 w-full overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
                  <img
                    src={selectedBrief.cover_image_url}
                    alt={selectedBrief.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="rounded-full bg-[#F4E7FF] px-2.5 py-0.5 text-xs font-bold text-[#9A6ADF]">
                    {selectedBrief.campaign_category || "Campaign Brief"}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedBrief.brand_or_product_name || "Brand Partner"}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900">{selectedBrief.title}</h2>

                {/* Overview */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campaign Overview</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {selectedBrief.description || selectedBrief.campaign_idea}
                  </p>
                </div>

                {/* Core Details Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#F4E7FF] bg-purple-50/20 p-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500">Agreed Budget</span>
                    <p className="font-extrabold text-slate-900">
                      {selectedBrief.budget_cents
                        ? `$${Math.round(selectedBrief.budget_cents / 100).toLocaleString()} USD`
                        : "Open to Proposals"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Timeline / Deadline</span>
                    <p className="font-bold text-slate-900">
                      {selectedBrief.deadline
                        ? new Date(selectedBrief.deadline).toLocaleDateString()
                        : "To be agreed upon"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Target Audience</span>
                    <p className="font-medium text-slate-700">{selectedBrief.target_audience || "Global Creators"}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Primary Objective</span>
                    <p className="font-medium text-slate-700">{selectedBrief.primary_objective || "Brand Launch"}</p>
                  </div>
                </div>

                {/* Deliverables List */}
                {selectedBrief.deliverables && selectedBrief.deliverables.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Required Deliverables ({selectedBrief.deliverables.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedBrief.deliverables.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">
                              {d.quantity}x {d.content_type}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Ratio: {d.aspect_ratio || "9:16"} • Format: {d.file_format || "MP4 / ProRes"}
                            </p>
                          </div>
                          {d.production_notes && (
                            <span className="text-[11px] text-purple-700 font-medium">
                              Note: {d.production_notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commercial Terms */}
                {selectedBrief.commercial_terms && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-1 text-slate-600">
                    <p>
                      <strong className="text-slate-800">Usage Rights:</strong>{" "}
                      {selectedBrief.commercial_terms.intended_usage?.join(", ") || "Commercial Social Rights"}
                    </p>
                    <p>
                      <strong className="text-slate-800">Territory:</strong>{" "}
                      {selectedBrief.commercial_terms.territory || "Global"}
                    </p>
                    <p>
                      <strong className="text-slate-800">Revisions Allowed:</strong>{" "}
                      {selectedBrief.commercial_terms.revisions_count ?? 2} standard review cycles
                    </p>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="pt-4 flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBrief(null)}
                    className="text-xs rounded-xl"
                  >
                    Close
                  </Button>
                  {!appliedBriefMap.has(selectedBrief.id) && (
                    <Button
                      onClick={() => {
                        const b = selectedBrief
                        setSelectedBrief(null)
                        openApplicationModal(b)
                      }}
                      className="bg-[#9A6ADF] text-white hover:bg-[#8654CF] text-xs font-bold rounded-xl"
                    >
                      Apply for this Campaign
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Application / Proposal Modal */}
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
                <span className="rounded-full bg-[#F4E7FF] px-2.5 py-0.5 text-xs font-bold text-[#9A6ADF]">
                  Proposal Submission
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Pitch for: {applyingBrief.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Tell the brand why your generative AI workflow, aesthetic vision, and delivery velocity are the perfect match.
                </p>
              </div>

              {appSuccessMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <h4 className="text-sm font-bold">{appSuccessMessage}</h4>
                  <p className="mt-1 text-xs text-emerald-700">
                    The brand has been notified. You can track this in "My Proposals".
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-5">
                  {appError && (
                    <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{appError}</span>
                    </div>
                  )}

                  {/* Pitch / Creative Angle */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Your Tailored Creative Pitch & Approach <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      placeholder="Describe your visual concept, the AI tools you will use (e.g. Runway Gen-3, Midjourney v6), and how you'll achieve brand consistency..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#9A6ADF] focus:outline-none"
                    />
                  </div>

                  {/* Rate & Timeline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Proposed Total Fee ($ USD)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={proposedRateUSD}
                        onChange={(e) => setProposedRateUSD(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Estimated Turnaround (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#9A6ADF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Portfolio Projects to showcase */}
                  {portfolioProjects.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Attach Relevant Portfolio Work ({selectedPortfolioIds.length} selected)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                        {portfolioProjects.map((proj) => {
                          const isSelected = selectedPortfolioIds.includes(proj.id)
                          return (
                            <div
                              key={proj.id}
                              onClick={() => {
                                setSelectedPortfolioIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== proj.id) : [...prev, proj.id]
                                )
                              }}
                              className={`cursor-pointer rounded-xl border p-2.5 text-xs transition flex items-center justify-between ${
                                isSelected
                                  ? "border-[#9A6ADF] bg-[#F4E7FF]/40 text-[#9A6ADF] font-bold"
                                  : "border-slate-200 hover:border-slate-300 text-slate-700"
                              }`}
                            >
                              <span className="truncate text-[11px]">{proj.title}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApplyingBrief(null)}
                      className="text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingApp}
                      className="bg-[#9A6ADF] text-white hover:bg-[#8654CF] text-xs font-bold rounded-xl"
                    >
                      {isSubmittingApp ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                          <span>Send Proposal</span>
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

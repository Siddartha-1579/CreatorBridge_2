import React, { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { CampaignBrief, CampaignApplication } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"
import {
  Megaphone,
  Plus,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit3,
  Eye,
  AlertCircle,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Inbox,
  X,
  Check,
  Loader2,
} from "lucide-react"

export const BrandCampaignsPage: React.FC = () => {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CampaignBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL")
  const [inspectingBrief, setInspectingBrief] = useState<CampaignBrief | null>(null)
  const [briefApplications, setBriefApplications] = useState<CampaignApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [appsError, setAppsError] = useState<string | null>(null)
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null)

  const handleOpenApplications = async (brief: CampaignBrief) => {
    setInspectingBrief(brief)
    setLoadingApps(true)
    setAppsError(null)
    try {
      const apps = await briefsService.listApplicationsForBrief(brief.id)
      setBriefApplications(apps || [])
    } catch (err: any) {
      console.warn("Failed to load applications for brief:", err)
      setBriefApplications([])
      if (err?.statusCode === 403 || err?.code === "FORBIDDEN") {
        setAppsError("You only have permission to view proposals for campaigns published by your organization.")
      } else {
        setAppsError(err?.message || "Unable to load proposals for this campaign.")
      }
    } finally {
      setLoadingApps(false)
    }
  }

  const handleUpdateApplicationStatus = async (appId: string, status: "ACCEPTED" | "SHORTLISTED" | "REJECTED") => {
    setUpdatingAppId(appId)
    try {
      const updated = await briefsService.updateApplicationStatus(appId, { status })
      setBriefApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)))
      if (status === "ACCEPTED") {
        alert("Proposal accepted! An active project collaboration workspace has been initialized in 'Active Projects'.")
      }
    } catch (err: any) {
      console.error("Failed to update proposal status:", err)
      alert(err.message || "Failed to update proposal status.")
    } finally {
      setUpdatingAppId(null)
    }
  }

  const loadCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch only the authenticated brand's private briefs (drafts and published)
      const myBriefs = await briefsService.listMyBriefs()
      setCampaigns(myBriefs || [])
    } catch (err: any) {
      console.error("Failed to load campaigns:", err)
      setError("Unable to retrieve your campaigns. Please check your connection or retry.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Tab filter
      if (activeTab === "PUBLISHED" && c.status !== "PUBLISHED") return false
      if (activeTab === "DRAFT" && c.status === "PUBLISHED") return false

      // Search filter
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const titleMatch = (c.title || "").toLowerCase().includes(query)
      const productMatch = (c.brand_or_product_name || c.product_or_service || "").toLowerCase().includes(query)
      const categoryMatch = (c.campaign_category || "").toLowerCase().includes(query)
      const objectiveMatch = (c.primary_objective || "").toLowerCase().includes(query)
      return titleMatch || productMatch || categoryMatch || objectiveMatch
    })
  }, [campaigns, activeTab, searchQuery])

  // Overview metrics
  const totalCount = campaigns.length
  const publishedCount = campaigns.filter((c) => c.status === "PUBLISHED").length
  const draftCount = campaigns.filter((c) => c.status !== "PUBLISHED").length
  const totalBudgetCents = campaigns.reduce((acc, c) => acc + (c.budget_cents || (c.commercial_terms?.budget_cents || 0)), 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-[#F4E7FF] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
              Brand Hub
            </span>
            <Badge variant="purple">My Campaigns</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Campaign Initiatives
          </h1>
          <p className="text-[#4B4652] text-sm mt-1">
            Manage your AI campaign briefs, track drafts and publications, match with vetted creators, and monitor active productions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/brand/discover">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#D8B8FF] text-[#7B42BC] hover:bg-[#F4E7FF]/50">
              <Users className="h-3.5 w-3.5" />
              Discover Talent
            </Button>
          </Link>
          <Link to="/brand/briefs/new">
            <Button variant="primary" size="sm" className="text-xs gap-1.5 bg-gradient-to-r from-[#9A6ADF] to-[#7B42BC] hover:from-[#8852D4] hover:to-[#6C34AC] text-white shadow-md shadow-purple-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              New Campaign Brief
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl bg-white border border-[#F4E7FF] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#4B4652]">Total Initiatives</p>
            <Layers className="h-4 w-4 text-[#9A6ADF]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] mt-2">{totalCount}</p>
          <p className="text-[11px] text-[#4B4652] mt-0.5">Campaigns registered</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border border-[#F4E7FF] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#4B4652]">Marketplace Active</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] mt-2">{publishedCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Open for creator applications</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border border-[#F4E7FF] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#4B4652]">Draft Briefs</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] mt-2">{draftCount}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">Editable in builder</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border border-[#F4E7FF] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#4B4652]">Total Budget</p>
            <DollarSign className="h-4 w-4 text-[#FF8E6E]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] mt-2">
            ${Math.round(totalBudgetCents / 100).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#4B4652] mt-0.5">Committed across briefs</p>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center bg-white p-1 rounded-xl border border-[#F4E7FF] shadow-sm">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-[#9A6ADF] text-white shadow-sm"
                : "text-[#4B4652] hover:text-[#111111]"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("PUBLISHED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PUBLISHED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[#4B4652] hover:text-emerald-700"
            }`}
          >
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setActiveTab("DRAFT")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "DRAFT"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-[#4B4652] hover:text-amber-700"
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#4B4652]/60" />
          <input
            type="text"
            placeholder="Search campaigns by name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#F4E7FF] rounded-xl text-xs text-[#111111] placeholder-[#4B4652]/50 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/30 focus:border-[#9A6ADF]"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadCampaigns} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Campaigns Listing */}
      {loading ? (
        <div className="p-16 text-center text-[#4B4652] text-xs">
          <div className="h-7 w-7 border-2 border-[#9A6ADF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="font-medium">Loading campaign initiatives...</span>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl bg-white border border-[#F4E7FF] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center mx-auto shadow-sm">
            <Megaphone className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111111]">
              {searchQuery ? "No matching campaigns found" : activeTab === "PUBLISHED" ? "No published campaigns yet" : activeTab === "DRAFT" ? "No drafts in progress" : "No campaign initiatives found"}
            </h3>
            <p className="text-xs text-[#4B4652] max-w-md mx-auto leading-relaxed mt-1">
              {searchQuery
                ? `No results match "${searchQuery}". Clear your search query or create a new campaign brief.`
                : "Create high-impact AI campaign briefs with structured deliverables, technical specifications, and smart creator matching."}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
                Clear Filter
              </Button>
            )}
            <Link to="/brand/briefs/new">
              <Button variant="primary" size="sm" className="text-xs gap-1.5 bg-gradient-to-r from-[#9A6ADF] to-[#7B42BC] text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Launch New Campaign Brief
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const isPublished = camp.status === "PUBLISHED"
            const budgetFormatted = (
              (camp.budget_cents || camp.commercial_terms?.budget_cents || 0) / 100
            ).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
            const deliverableCount = camp.deliverables?.length || 0

            return (
              <Card
                key={camp.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#D8B8FF] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Info Column with Cover Thumbnail */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                    {camp.cover_image_url && (
                      <div className="w-full sm:w-36 h-28 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#F4E7FF] shadow-2xs">
                        <ImageWithFallback
                          src={camp.cover_image_url}
                          fallbackSrc="/demo-assets/skincare-luxury-serum.jpg"
                          alt={camp.title}
                          category={camp.campaign_category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-[#111111] text-base sm:text-lg tracking-tight">
                          {camp.title}
                        </h3>
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Published & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            Draft In Progress
                          </span>
                        )}
                        {camp.campaign_category && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F4E7FF]/60 text-[#7B42BC]">
                            {camp.campaign_category}
                          </span>
                        )}
                      </div>

                      {camp.brand_or_product_name && (
                        <p className="text-xs text-[#9A6ADF] font-bold">
                          Product: {camp.brand_or_product_name}
                        </p>
                      )}

                      <p className="text-xs text-[#4B4652] line-clamp-2 max-w-2xl leading-relaxed">
                        {camp.executive_summary || camp.campaign_idea || camp.description || "Structured AI campaign brief."}
                      </p>

                      {/* Metadata chips */}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#4B4652]">
                      <div className="flex items-center gap-1 font-bold text-emerald-700">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{budgetFormatted}</span>
                      </div>

                      {camp.cpm_rate_cents ? (
                        <div className="flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <span>${Math.round(camp.cpm_rate_cents / 100)} CPM</span>
                        </div>
                      ) : null}

                      {camp.views_count != null && camp.views_count > 0 ? (
                        <div className="flex items-center gap-1 text-blue-700 font-medium">
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          <span>{camp.views_count.toLocaleString()} Views</span>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-[#9A6ADF]" />
                        <span>{deliverableCount} {deliverableCount === 1 ? "Deliverable" : "Deliverables"}</span>
                      </div>

                      {camp.primary_objective && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-[#FF8E6E]" />
                          <span>{camp.primary_objective}</span>
                        </div>
                      )}

                      {camp.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Deadline: {camp.deadline.substring(0, 10)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 w-full lg:w-auto">
                    <Link to={`/brand/campaigns/${camp.id}`} className="w-full sm:w-auto">
                      <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs">
                        <Eye className="h-3.5 w-3.5" />
                        Manage Hub
                      </Button>
                    </Link>

                    <Link to={`/brand/briefs/${camp.id}/edit`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1.5 border-[#D8B8FF] text-[#7B42BC] hover:bg-[#F4E7FF]/40">
                        <Edit3 className="h-3.5 w-3.5" />
                        {isPublished ? "Edit Brief" : "Continue Draft"}
                      </Button>
                    </Link>

                    <Link to={`/brand/discover?briefId=${camp.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1.5 border-slate-200 text-[#4B4652] hover:text-[#111111]">
                        <Users className="h-3.5 w-3.5" />
                        Find Talent
                      </Button>
                    </Link>

                    {isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenApplications(camp)}
                        className="w-full sm:w-auto text-xs gap-1.5 border-[#9A6ADF]/40 text-[#7B42BC] hover:bg-[#F4E7FF]/40 font-bold"
                      >
                        <Inbox className="h-3.5 w-3.5 text-[#9A6ADF]" />
                        Proposals
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Brand Proposals Review Modal */}
      {inspectingBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setInspectingBrief(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <span className="rounded-full bg-[#F4E7FF] px-2.5 py-0.5 text-xs font-bold text-[#9A6ADF]">
                Creator Proposals
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Applications for: {inspectingBrief.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Review tailored proposals, rates, and specialized capabilities submitted by creators.
              </p>
            </div>

            {appsError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{appsError}</span>
              </div>
            )}

            {loadingApps ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#9A6ADF]" />
                <p className="text-xs text-slate-500">Loading submitted applications...</p>
              </div>
            ) : briefApplications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-slate-300" />
                <h4 className="mt-2 text-xs font-bold text-slate-700">No proposals received yet</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Creators discovering this campaign in the Creator Hub will appear here once they apply.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {briefApplications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-2xl border border-[#F4E7FF] bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {app.creator_name || "Generative AI Creator"}
                        </span>
                        {app.creator_specialization && (
                          <span className="ml-2 text-[11px] text-purple-700 font-medium">
                            • {app.creator_specialization}
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          app.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "SHORTLISTED"
                            ? "bg-purple-100 text-purple-800"
                            : app.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      "{app.pitch}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-xs pt-1">
                      <div className="space-x-3 text-slate-500">
                        <span>
                          Proposed Fee:{" "}
                          <strong className="text-slate-900">
                            {app.proposed_rate_cents ? `$${(app.proposed_rate_cents / 100).toLocaleString()}` : "Standard"}
                          </strong>
                        </span>
                        {app.estimated_days && (
                          <span>
                            Delivery: <strong className="text-slate-900">{app.estimated_days} days</strong>
                          </span>
                        )}
                      </div>

                      {app.status === "PENDING" && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicationStatus(app.id, "SHORTLISTED")}
                            className="text-[11px] h-7 px-2.5 rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicationStatus(app.id, "ACCEPTED")}
                            className="text-[11px] h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Accept & Start Project
                          </Button>
                        </div>
                      )}

                      {app.status === "ACCEPTED" && (
                        <Link to="/brand/projects">
                          <Button size="sm" className="text-[11px] h-7 px-2.5 rounded-lg bg-[#9A6ADF] text-white">
                            Open Collaboration Workspace →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


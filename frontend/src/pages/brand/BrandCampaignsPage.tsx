import React, { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { CampaignBrief } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"

export const BrandCampaignsPage: React.FC = () => {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CampaignBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL")

  const loadCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      // First try fetching brand's private briefs (which includes drafts)
      const myBriefs = await briefsService.listMyBriefs()
      if (myBriefs && myBriefs.length > 0) {
        setCampaigns(myBriefs)
      } else {
        const publicBriefs = await briefsService.listBriefs()
        setCampaigns(publicBriefs || [])
      }
    } catch (err: any) {
      console.warn("Could not load private briefs, falling back to public briefs:", err)
      try {
        const publicBriefs = await briefsService.listBriefs()
        setCampaigns(publicBriefs || [])
      } catch (fallbackErr: any) {
        console.error("Failed to load campaigns:", fallbackErr)
        setError("Unable to retrieve campaigns. Please check your connection or retry.")
      }
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info Column */}
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

                  {/* Actions Column */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 w-full lg:w-auto">
                    <Link to={`/brand/briefs/${camp.id}/edit`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1.5 border-[#D8B8FF] text-[#7B42BC] hover:bg-[#F4E7FF]/40">
                        <Edit3 className="h-3.5 w-3.5" />
                        {isPublished ? "View / Edit Brief" : "Continue Draft"}
                      </Button>
                    </Link>

                    <Link to={`/brand/discover?briefId=${camp.id}`} className="w-full sm:w-auto">
                      <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs gap-1.5 bg-gradient-to-r from-[#9A6ADF] to-[#7B42BC] hover:from-[#8852D4] hover:to-[#6C34AC] text-white shadow-sm">
                        <Users className="h-3.5 w-3.5" />
                        Find Creators
                      </Button>
                    </Link>

                    <Link to={`/brand/projects?briefId=${camp.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1.5 border-slate-200 text-[#4B4652] hover:text-[#111111]">
                        <Briefcase className="h-3.5 w-3.5" />
                        Projects
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

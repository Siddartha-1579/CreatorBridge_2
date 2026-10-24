import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { ClipSubmission, SubmissionStatus } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/currency"
import {
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  DollarSign,
  Eye,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  RefreshCw,
  Layers,
  MessageSquare,
} from "lucide-react"

export const CreatorSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<ClipSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"ALL" | SubmissionStatus>("ALL")
  const [platformFilter, setPlatformFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const loadSubmissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await briefsService.listMySubmissions()
      setSubmissions(data || [])
    } catch (err: any) {
      console.error("Failed to load creator submissions:", err)
      setError(err?.message || "Could not retrieve your submissions.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [])

  // Metrics summary
  const metrics = useMemo(() => {
    const total = submissions.length
    const approved = submissions.filter((s) => s.status === "APPROVED")
    const pending = submissions.filter((s) => s.status === "PENDING_REVIEW")
    const revisions = submissions.filter((s) => s.status === "REVISION_REQUESTED")
    const totalEarnedCents = approved.reduce((acc, s) => acc + (s.earned_cents || 0), 0)
    const totalViews = submissions.reduce((acc, s) => acc + (s.views_count || 0), 0)

    return {
      total,
      approvedCount: approved.length,
      pendingCount: pending.length,
      revisionCount: revisions.length,
      totalEarnedFormatted: formatCurrency(totalEarnedCents, "INR", true, true),
      totalEarnedUSD: (totalEarnedCents / 100).toFixed(2),
      totalViews,
    }
  }, [submissions])

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "ALL" && sub.status !== statusFilter) return false
      if (platformFilter !== "ALL" && sub.platform !== platformFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = sub.title?.toLowerCase().includes(query)
        const matchCampaign = sub.campaign_title?.toLowerCase().includes(query)
        const matchBrand = sub.brand_name?.toLowerCase().includes(query)
        const matchTools = sub.ai_tools?.some((t) => t.toLowerCase().includes(query))
        if (!matchTitle && !matchCampaign && !matchBrand && !matchTools) return false
      }
      return true
    })
  }, [submissions, statusFilter, platformFilter, searchQuery])

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Rewarded
          </Badge>
        )
      case "PENDING_REVIEW":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Brand Review
          </Badge>
        )
      case "REVISION_REQUESTED":
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
            Revision Requested
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Not Accepted
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "TIKTOK":
        return { label: "TikTok", color: "bg-slate-900 text-white" }
      case "INSTAGRAM":
        return { label: "Instagram Reels", color: "bg-gradient-to-r from-purple-600 to-pink-500 text-white" }
      case "YOUTUBE_SHORTS":
      case "YOUTUBE":
        return { label: "YouTube Shorts", color: "bg-red-600 text-white" }
      default:
        return { label: platform, color: "bg-slate-700 text-white" }
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4E7FF] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              My Submissions & Rewards
            </h1>
            <Badge variant="purple" className="text-xs">
              Content Rewards
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#4B4652] mt-1">
            Track video clip submissions, verification statuses, generated views, and earned cash rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubmissions}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/creator/campaigns">
            <Button variant="primary" size="sm" className="text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Discover Campaigns
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-[#F4E7FF] bg-white rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B4652] mb-1 font-medium">
            <span>Total Clips</span>
            <Video className="w-4 h-4 text-[#9A6ADF]" />
          </div>
          <div className="text-2xl font-black text-[#111111]">{metrics.total}</div>
          <div className="text-[11px] text-[#4B4652] mt-1 flex items-center gap-1">
            <span>Across all joined campaigns</span>
          </div>
        </Card>

        <Card className="p-4 border-[#F4E7FF] bg-white rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B4652] mb-1 font-medium">
            <span>Approved Rewards</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.approvedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {metrics.revisionCount > 0 ? `${metrics.revisionCount} need revisions` : "Approved for reward credit"}
          </div>
        </Card>

        <Card className="p-4 border-[#F4E7FF] bg-white rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B4652] mb-1 font-medium">
            <span>Recorded Views</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#111111]">
            {metrics.totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#4B4652] mt-1">Verified & reported views</div>
        </Card>

        <Card className="p-4 border-[#F4E7FF] bg-gradient-to-br from-[#9A6ADF]/10 via-[#F4E7FF]/40 to-white rounded-2xl shadow-2xs border-[#D8B8FF]">
          <div className="flex items-center justify-between text-xs text-[#9A6ADF] mb-1 font-semibold">
            <span>Approved Rewards (Demo)</span>
            <DollarSign className="w-4 h-4 text-[#9A6ADF]" />
          </div>
          <div className="text-2xl font-black text-[#111111]">{metrics.totalEarnedFormatted}</div>
          <div className="text-[11px] text-[#9A6ADF] font-medium mt-1">
            Earned reward credits (Simulation)
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#F4E7FF] shadow-2xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "ALL"
                ? "bg-[#9A6ADF] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING_REVIEW")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "PENDING_REVIEW"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            In Review ({metrics.pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "APPROVED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Approved ({metrics.approvedCount})
          </button>
          {metrics.revisionCount > 0 && (
            <button
              onClick={() => setStatusFilter("REVISION_REQUESTED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === "REVISION_REQUESTED"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-orange-50 text-orange-700 hover:bg-orange-100"
              }`}
            >
              Needs Revision ({metrics.revisionCount})
            </button>
          )}
        </div>

        {/* Right Search & Platform */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search submissions or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF] focus:border-transparent bg-slate-50/50"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]"
          >
            <option value="ALL">All Platforms</option>
            <option value="TIKTOK">TikTok</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#9A6ADF]" />
          <span className="text-xs">Loading submissions...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadSubmissions} className="mt-3 text-xs">
            Retry
          </Button>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-[#F4E7FF] border border-[#D8B8FF] flex items-center justify-center text-[#9A6ADF] mx-auto mb-4">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No clip submissions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {statusFilter !== "ALL" || platformFilter !== "ALL" || searchQuery
              ? "No submissions match your active filter criteria."
              : "You haven't submitted any video clips yet. Join an active campaign and submit your creative content to start earning CPM rewards."}
          </p>
          <Link to="/creator/campaigns">
            <Button variant="primary" size="sm" className="text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Explore Open Campaigns
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const platformInfo = getPlatformIcon(sub.platform)
            return (
              <Card
                key={sub.id}
                className="p-5 border border-[#F4E7FF] bg-white rounded-2xl shadow-2xs hover:border-[#D8B8FF] hover:shadow-xs transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${platformInfo.color}`}
                      >
                        {platformInfo.label}
                      </span>
                      {getStatusBadge(sub.status)}
                      <span className="text-[11px] text-slate-400">
                        Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#111111] leading-snug">
                        {sub.title}
                      </h3>
                      {sub.description && (
                        <p className="text-xs text-[#4B4652] mt-1 line-clamp-2">
                          {sub.description}
                        </p>
                      )}
                    </div>

                    {/* Campaign Reference */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Layers className="w-3.5 h-3.5 text-[#9A6ADF]" />
                      <span>Campaign:</span>
                      <Link
                        to={`/creator/campaigns/${sub.campaign_id}`}
                        className="font-semibold text-[#9A6ADF] hover:underline inline-flex items-center gap-1"
                      >
                        {sub.campaign_title || "View Campaign"}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* AI Tools Tagged */}
                    {sub.ai_tools && sub.ai_tools.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-medium">Tools:</span>
                        {sub.ai_tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]/60"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Metrics & External Clip Link */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-sm font-black text-[#111111]">
                        {formatCurrency(sub.earned_cents, "INR", true, true)}
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          {sub.status === "APPROVED" ? "Approved Reward (Demo)" : "Pending Review"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#4B4652] flex items-center gap-1 md:justify-end mt-0.5">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>{(sub.views_count || 0).toLocaleString()} {sub.status === "APPROVED" ? "Verified Views" : "Reported Views"}</span>
                      </div>
                    </div>

                    <a
                      href={sub.clip_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-[#F4E7FF] hover:text-[#9A6ADF] border border-slate-200 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Clip</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                </div>

                {/* Brand Feedback Box if Present */}
                {sub.feedback && (
                  <div className="mt-4 p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-950">
                    <MessageSquare className="w-4 h-4 text-[#9A6ADF] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#9A6ADF]">Brand Feedback:</span>
                      <p className="text-slate-700 leading-relaxed">{sub.feedback}</p>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default CreatorSubmissionsPage

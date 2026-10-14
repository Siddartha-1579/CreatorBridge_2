import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { CampaignBrief, CampaignAnalytics, ClipSubmission } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"
import {
  ArrowLeft,
  Megaphone,
  DollarSign,
  Eye,
  Users,
  Video,
  BarChart3,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  Sparkles,
  ExternalLink,
  Layers,
  Wand2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Edit3,
  MessageSquare,
  ChevronRight,
} from "lucide-react"

export const BrandCampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<CampaignBrief | null>(null)
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [submissions, setSubmissions] = useState<ClipSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!campaignId) return
    setLoading(true)
    setError(null)
    try {
      const [briefData, subsData] = await Promise.all([
        briefsService.getBrief(campaignId),
        briefsService.listSubmissionsForCampaign(campaignId).catch(() => []),
      ])
      setCampaign(briefData)
      setSubmissions(subsData || [])

      try {
        const analyticsData = await briefsService.getCampaignAnalytics(campaignId)
        setAnalytics(analyticsData)
      } catch {
        // Analytics may be empty if no participants yet
      }
    } catch (err: any) {
      console.error("Failed to load campaign details:", err)
      setError(err?.message || "Could not load campaign.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [campaignId])

  const handleTogglePause = async () => {
    if (!campaignId || !campaign) return
    setActionLoading(true)
    try {
      if (campaign.status === "PAUSED") {
        const updated = await briefsService.resumeCampaign(campaignId)
        setCampaign(updated)
      } else {
        const updated = await briefsService.pauseCampaign(campaignId)
        setCampaign(updated)
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update campaign status.")
    } finally {
      setActionLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!campaignId || !campaign) return
    setActionLoading(true)
    try {
      const updated = await briefsService.publishBrief(campaignId)
      setCampaign(updated)
    } catch (err: any) {
      alert(err?.message || "Failed to publish campaign.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-xs">Loading campaign management...</span>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs max-w-xl mx-auto">
        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
        <p>{error || "Campaign not found."}</p>
        <Link to="/brand/campaigns">
          <Button variant="outline" size="sm" className="mt-3 text-xs">
            Back to Campaigns
          </Button>
        </Link>
      </div>
    )
  }

  const cpmRateUSD = campaign.cpm_rate_cents ? Math.round(campaign.cpm_rate_cents / 100) : 0
  const totalPoolUSD = campaign.total_pool_cents ? Math.round(campaign.total_pool_cents / 100) : 0
  const paidPoolUSD = campaign.paid_pool_cents ? Math.round(campaign.paid_pool_cents / 100) : 0
  const remainingPoolUSD = Math.max(0, totalPoolUSD - paidPoolUSD)
  const poolProgress = totalPoolUSD > 0 ? Math.min(100, (paidPoolUSD / totalPoolUSD) * 100) : 0

  const pendingSubmissions = submissions.filter((s) => s.status === "PENDING_REVIEW")
  const approvedSubmissions = submissions.filter((s) => s.status === "APPROVED")

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/brand/campaigns"
            className="p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {campaign.title}
              </h1>
              <Badge
                className={
                  campaign.status === "PUBLISHED" || campaign.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                    : campaign.status === "PAUSED"
                    ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                    : "bg-slate-100 text-slate-700 font-bold"
                }
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {campaign.brand_or_product_name || "Commercial Brand"} • Created {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {campaign.status === "DRAFT" ? (
            <Button
              onClick={handlePublish}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Publish Live
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              disabled={actionLoading}
              className="text-xs font-semibold"
            >
              {campaign.status === "PAUSED" ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Resume Campaign
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Pause Campaign
                </>
              )}
            </Button>
          )}

          <Link to={`/brand/campaigns/${campaign.id}/submissions`}>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5">
              <Video className="w-3.5 h-3.5" />
              <span>Review Clips</span>
              {pendingSubmissions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {pendingSubmissions.length}
                </span>
              )}
            </Button>
          </Link>

          <Link to={`/brand/campaigns/${campaign.id}/analytics`}>
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Analytics</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-purple-100 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>CPM Rate</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">${cpmRateUSD}</div>
          <div className="text-[11px] text-slate-400 mt-1">Per 1,000 verified views</div>
        </Card>

        <Card className="p-4 bg-white border-purple-100 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Rewards Pool</span>
            <span className="text-[10px] font-bold text-purple-600">{poolProgress.toFixed(0)}% paid</span>
          </div>
          <div className="text-2xl font-black text-slate-900">${remainingPoolUSD.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            ${paidPoolUSD.toLocaleString()} paid of ${totalPoolUSD.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 bg-white border-purple-100 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Tracked Views</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(campaign.views_count || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Generated by creators</div>
        </Card>

        <Card className="p-4 bg-white border-purple-100 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Creators</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {campaign.participants_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Enrolled in campaign</div>
        </Card>
      </div>

      {/* SUBMISSIONS QUEUE BANNER */}
      <Card className="p-5 bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Clip Review Queue: {submissions.length} Total Submissions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingSubmissions.length} pending review • {approvedSubmissions.length} approved & rewarded
            </p>
          </div>
        </div>

        <Link to={`/brand/campaigns/${campaign.id}/submissions`}>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 shrink-0">
            <span>Open Review Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </Card>

      {/* MAIN TWO-COLUMN DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brief Content & Guidelines */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white border-purple-100 rounded-2xl shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-600" />
              <span>Campaign Objectives & Concept</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {campaign.description || campaign.campaign_idea || "No summary provided."}
            </p>

            {campaign.objectives && campaign.objectives.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-800">Key Objectives:</span>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {campaign.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Creative Direction & Tools */}
          <Card className="p-6 bg-white border-purple-100 rounded-2xl shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span>Accepted AI Stack & Formats</span>
            </h3>

            <div>
              <span className="text-xs font-semibold text-slate-500">Approved AI Tools:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {campaign.required_tools && campaign.required_tools.length > 0 ? (
                  campaign.required_tools.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Any commercial generative tools permitted</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500">Target Platforms:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {campaign.platforms && campaign.platforms.length > 0 ? (
                  campaign.platforms.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">TikTok, Instagram Reels, YouTube Shorts</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Artwork & Community Action */}
        <div className="space-y-6">
          <Card className="p-4 bg-white border-purple-100 rounded-2xl shadow-2xs">
            <div className="h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3">
              <ImageWithFallback
                src={campaign.cover_image_url || "/demo-assets/fashion-editorial-cyber.jpg"}
                fallbackSrc="/demo-assets/fashion-editorial-cyber.jpg"
                alt={campaign.title}
                category={campaign.campaign_category}
                iconType="briefcase"
                fallbackText={campaign.title}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">Cover Visual</p>
          </Card>

          <Card className="p-5 bg-white border-purple-100 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Brand Community</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Publish announcements, pin creative tips, or release asset packs to creators participating in your campaigns.
            </p>
            <Link to="/brand/community">
              <Button variant="outline" size="sm" className="w-full text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50">
                Post in Community
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
export default BrandCampaignDetailPage

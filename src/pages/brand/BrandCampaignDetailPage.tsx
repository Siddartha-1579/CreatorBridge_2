import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import { engagementsService } from "@/services/engagements.service"
import { ApiError } from "@/lib/apiClient"
import { ErrorState } from "@/components/common/ErrorState"
import type { CampaignBrief, CampaignAnalytics, ClipSubmission, ShortlistCreatorItem } from "@/types"
import { ENGAGEMENT_STATUS_META } from "@/lib/engagementStateMachine"
import { formatCurrency } from "@/lib/currency"
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
  Send,
  ChevronRight,
} from "lucide-react"

export const BrandCampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<CampaignBrief | null>(null)
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [submissions, setSubmissions] = useState<ClipSubmission[]>([])
  const [shortlist, setShortlist] = useState<ShortlistCreatorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [invitingItem, setInvitingItem] = useState<ShortlistCreatorItem | null>(null)
  const [invitationMessage, setInvitationMessage] = useState("")
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [errorInfo, setErrorInfo] = useState<{
    statusCode?: number
    errorCode?: string
    message: string
  } | null>(null)

  const loadData = async () => {
    if (!campaignId) return
    setLoading(true)
    setErrorInfo(null)
    try {
      const [briefData, subsData, shortlistData] = await Promise.all([
        briefsService.getBrief(campaignId),
        briefsService.listSubmissionsForCampaign(campaignId).catch(() => []),
        engagementsService.getBriefShortlist(campaignId).catch(() => []),
      ])
      setCampaign(briefData)
      setSubmissions(subsData || [])
      setShortlist(shortlistData || [])

      try {
        const analyticsData = await briefsService.getCampaignAnalytics(campaignId)
        setAnalytics(analyticsData)
      } catch {
        // Analytics may be empty if no participants yet
      }
    } catch (err: any) {
      console.error("Failed to load campaign details:", err)
      setErrorInfo({
        statusCode: err?.statusCode || (err instanceof ApiError ? err.statusCode : undefined),
        errorCode: err?.code || (err instanceof ApiError ? err.code : undefined),
        message: err?.message || "Could not load campaign.",
      })
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

  const handleRemoveShortlist = async (engagementId: string) => {
    try {
      await engagementsService.removeFromShortlist(engagementId)
      setShortlist((prev) => prev.filter((i) => i.engagement_id !== engagementId))
    } catch (err: any) {
      alert(err?.message || "Failed to remove creator from shortlist.")
    }
  }

  const handleSendInviteFromDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaign || !invitingItem) return
    setIsSendingInvite(true)
    try {
      await engagementsService.sendInvitation({
        brief_id: campaign.id,
        creator_id: invitingItem.creator_id,
        proposed_terms: {
          deliverables: (campaign.deliverables as any) || [],
          scope_description: campaign.description || campaign.title,
          budget_cents: campaign.budget_cents || 250000,
          currency: "INR",
          deadline: campaign.deadline,
          revision_allowance: campaign.commercial_terms?.revisions_count || 2,
          commercial_rights_required: campaign.commercial_terms?.commercial_rights_required ?? true,
          usage_rights: "Commercial advertising distribution rights",
        },
        invitation_message: invitationMessage || "We would love to invite you to collaborate on our campaign.",
      })
      const updated = await engagementsService.getBriefShortlist(campaign.id)
      setShortlist(updated)
      setInvitingItem(null)
      setInvitationMessage("")
    } catch (err: any) {
      alert(err?.message || "Failed to send engagement invitation.")
    } finally {
      setIsSendingInvite(false)
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

  if (errorInfo || !campaign) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <ErrorState
          title={errorInfo?.statusCode === 404 ? "Campaign Not Found" : undefined}
          message={errorInfo?.message}
          statusCode={errorInfo?.statusCode}
          errorCode={errorInfo?.errorCode}
          onRetry={loadData}
          backTo="/brand/campaigns"
          backLabel="Back to Campaigns"
          portal="brand"
        />
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

          <Link to={`/brand/discover?briefId=${campaign.id}`}>
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Matched Creators</span>
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

      {/* CANDIDATE SHORTLIST & ENGAGEMENT PIPELINE (FEATURE 3.2) */}
      <Card className="p-6 bg-white border-purple-100 rounded-2xl shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Candidate Shortlist & Engagement Pipeline</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                  {shortlist.length} Candidate{shortlist.length !== 1 ? "s" : ""}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage A through E: Track shortlisted creators, send invitations with proposed terms, and manage active deliveries.
              </p>
            </div>
          </div>

          <Link to={`/brand/discover?briefId=${campaign.id}`}>
            <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Discover & Match Creators</span>
            </Button>
          </Link>
        </div>

        {shortlist.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No creators shortlisted yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Use Creator Matching to find AI creators whose style, tools, and commercial licensing match your brief, then add them to your candidate shortlist.
            </p>
            <Link to={`/brand/discover?briefId=${campaign.id}`} className="inline-block mt-3">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Find Matching Creators
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {shortlist.map((item) => {
              const statusMeta = ENGAGEMENT_STATUS_META[item.status] || {
                label: item.status,
                color: "text-slate-700",
                bg: "bg-slate-100",
                border: "border-slate-200",
              }

              return (
                <div key={item.engagement_id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                      {item.creator_avatar_url ? (
                        <img src={item.creator_avatar_url} alt={item.creator_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-purple-700">
                          {item.creator_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.creator_name}</span>
                        <span className="text-xs text-slate-400">@{item.creator_handle}</span>
                        {item.is_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{item.primary_specialization || "AI Video Specialist"}</span>
                        <span>•</span>
                        <span>Reputation: {item.reputation_score.toFixed(1)}/5.0</span>
                        {item.hourly_rate_cents && (
                          <>
                            <span>•</span>
                            <span>Rate: {formatCurrency(item.hourly_rate_cents, "INR")}/hr</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "SHORTLISTED" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setInvitingItem(item)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Invitation</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveShortlist(item.engagement_id)}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          Remove
                        </Button>
                      </>
                    )}

                    {item.status === "INVITED" && (
                      <span className="text-xs text-blue-600 font-medium">Awaiting creator response</span>
                    )}

                    {["ACCEPTED", "AWAITING_CONFIRMATION", "CONFIRMED", "IN_PRODUCTION", "SUBMITTED", "CHANGES_REQUESTED", "COMPLETED"].includes(item.status) && (
                      <Link to="/brand/projects">
                        <Button size="sm" variant="outline" className="text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50">
                          <span>View in Projects</span>
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Invitation Modal */}
      {invitingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-purple-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Invite {invitingItem.creator_name} to Campaign
              </h3>
              <button
                onClick={() => setInvitingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-purple-50 rounded-xl space-y-1">
                <div className="font-bold text-purple-900">Proposed Engagement Terms</div>
                <div>Budget: {formatCurrency(campaign.budget_cents || 250000, "INR")}</div>
                <div>Revision Allowance: {campaign.commercial_terms?.revisions_count || 2} Rounds</div>
                <div>Commercial Rights: Required (Commercial Advertising)</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invitation Message to Creator
                </label>
                <textarea
                  rows={3}
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="We loved your style and would love to collaborate on our campaign..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvitingItem(null)}
                disabled={isSendingInvite}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendInviteFromDetail}
                disabled={isSendingInvite}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingInvite ? "Sending..." : "Dispatch Invitation"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

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

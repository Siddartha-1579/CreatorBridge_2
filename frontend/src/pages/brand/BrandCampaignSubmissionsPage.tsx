import React, { useState, useEffect, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { CampaignBrief, ClipSubmission, SubmissionStatus } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  DollarSign,
  Eye,
  Filter,
  Search,
  Loader2,
  MessageSquare,
  Sparkles,
  Check,
  X,
  User,
  Wand2,
} from "lucide-react"

export const BrandCampaignSubmissionsPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>()
  const [campaign, setCampaign] = useState<CampaignBrief | null>(null)
  const [submissions, setSubmissions] = useState<ClipSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"ALL" | SubmissionStatus>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Review Modal State
  const [selectedSub, setSelectedSub] = useState<ClipSubmission | null>(null)
  const [reviewMode, setReviewMode] = useState<"APPROVE" | "REVISE" | "REJECT">("APPROVE")
  const [verifiedViews, setVerifiedViews] = useState<number>(0)
  const [payoutUSD, setPayoutUSD] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const loadData = async () => {
    if (!campaignId) return
    setLoading(true)
    setError(null)
    try {
      const [briefData, subsData] = await Promise.all([
        briefsService.getBrief(campaignId),
        briefsService.listSubmissionsForCampaign(campaignId),
      ])
      setCampaign(briefData)
      setSubmissions(subsData || [])
    } catch (err: any) {
      console.error("Failed to load submissions:", err)
      setError(err?.message || "Could not retrieve submissions.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [campaignId])

  const openReviewModal = (
    sub: ClipSubmission,
    mode: "APPROVE" | "REVISE" | "REJECT"
  ) => {
    setSelectedSub(sub)
    setReviewMode(mode)
    setReviewError(null)

    const views = sub.views_count || 1000
    setVerifiedViews(views)

    // Calculate payout from campaign CPM or default $12/1000
    const cpmRateUSD = (campaign?.cpm_rate_cents || 1200) / 100
    const calculatedUSD = parseFloat(((views / 1000) * cpmRateUSD).toFixed(2))
    setPayoutUSD(calculatedUSD)

    if (mode === "APPROVE") {
      setFeedback("Excellent work! Creative aligns with the guidelines.")
    } else if (mode === "REVISE") {
      setFeedback("")
    } else {
      setFeedback("")
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return
    setIsSubmittingReview(true)
    setReviewError(null)

    try {
      const newStatus: SubmissionStatus =
        reviewMode === "APPROVE"
          ? "APPROVED"
          : reviewMode === "REVISE"
          ? "REVISION_REQUESTED"
          : "REJECTED"

      const updated = await briefsService.reviewSubmission(selectedSub.id, {
        status: newStatus,
        verified_views: reviewMode === "APPROVE" ? verifiedViews : undefined,
        payout_cents: reviewMode === "APPROVE" ? Math.round(payoutUSD * 100) : undefined,
        feedback: feedback.trim() || undefined,
      })

      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setSelectedSub(null)
    } catch (err: any) {
      console.error("Failed to submit review:", err)
      setReviewError(err?.message || "Failed to submit review.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "ALL" && sub.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = sub.title?.toLowerCase().includes(q)
        const matchCreator = sub.creator_name?.toLowerCase().includes(q)
        const matchTools = sub.ai_tools?.some((t) => t.toLowerCase().includes(q))
        if (!matchTitle && !matchCreator && !matchTools) return false
      }
      return true
    })
  }, [submissions, statusFilter, searchQuery])

  const pendingCount = submissions.filter((s) => s.status === "PENDING_REVIEW").length
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to={campaignId ? `/brand/campaigns/${campaignId}` : "/brand/campaigns"}
            className="p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Clip Review Queue
              </h1>
              {campaign && (
                <Badge variant="purple" className="text-xs">
                  {campaign.title}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review video submissions, verify engagement metrics, calculate CPM payouts, and send direct feedback.
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            {pendingCount} Pending Review
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            {approvedCount} Approved
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "ALL"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Clips ({submissions.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING_REVIEW")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "PENDING_REVIEW"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "APPROVED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search creator, title, tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-xs">Loading submissions queue...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          <p>{error}</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto mb-4">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No submissions in queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== "ALL"
              ? "No submissions match this status filter."
              : "No creator clips have been submitted yet for this campaign. As creators join and publish content, their clips will appear here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            return (
              <Card
                key={sub.id}
                className="p-5 bg-white border border-purple-100 rounded-2xl shadow-2xs hover:border-purple-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Creator & Clip Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                        {sub.creator_avatar_url ? (
                          <img
                            src={sub.creator_avatar_url}
                            alt={sub.creator_name || "Creator"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {sub.creator_name || "Creator"}
                        </span>
                        {sub.creator_handle && (
                          <span className="text-[11px] text-slate-400 ml-1.5">
                            @{sub.creator_handle}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white ml-2">
                        {sub.platform}
                      </span>

                      {sub.status === "APPROVED" && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          ✓ Approved
                        </Badge>
                      )}
                      {sub.status === "PENDING_REVIEW" && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                          • Needs Review
                        </Badge>
                      )}
                      {sub.status === "REVISION_REQUESTED" && (
                        <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold">
                          Revision Requested
                        </Badge>
                      )}
                      {sub.status === "REJECTED" && (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                          Rejected
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sub.title}</h4>
                      {sub.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{sub.description}</p>
                      )}
                    </div>

                    {/* AI Tools Tagged */}
                    {sub.ai_tools && sub.ai_tools.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Tools:</span>
                        {sub.ai_tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Feedback if already left */}
                    {sub.feedback && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>Your Note:</strong> {sub.feedback}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-base font-black text-slate-900">
                        ${((sub.earned_cents || 0) / 100).toFixed(2)}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {sub.status === "APPROVED" ? "Approved Reward (Demo)" : "Pending Review"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 md:justify-end mt-0.5">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>{(sub.views_count || 0).toLocaleString()} {sub.status === "APPROVED" ? "Verified Views" : "Reported Views"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={sub.clip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      <Button
                        size="sm"
                        onClick={() => openReviewModal(sub, "APPROVE")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewModal(sub, "REVISE")}
                        className="text-xs font-semibold text-orange-700 border-orange-200 hover:bg-orange-50"
                      >
                        Revise
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openReviewModal(sub, "REJECT")}
                        className="text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Review Dialog Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  reviewMode === "APPROVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : reviewMode === "REVISE"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {reviewMode === "APPROVE"
                  ? "Approve & Reward Clip"
                  : reviewMode === "REVISE"
                  ? "Request Creative Revision"
                  : "Reject Clip Submission"}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {selectedSub.title}
              </h3>
              <p className="text-xs text-slate-500">
                Submitted by {selectedSub.creator_name || "Creator"} on {selectedSub.platform}
              </p>
            </div>

            {reviewError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewMode === "APPROVE" && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Verified Views (Audited)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={verifiedViews}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setVerifiedViews(v)
                        const cpmRateUSD = (campaign?.cpm_rate_cents || 1200) / 100
                        setPayoutUSD(parseFloat(((v / 1000) * cpmRateUSD).toFixed(2)))
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Approved Reward (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={payoutUSD}
                      onChange={(e) => setPayoutUSD(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {reviewMode === "APPROVE"
                    ? "Feedback / Commendation (Optional)"
                    : reviewMode === "REVISE"
                    ? "Revision Instructions (Required)"
                    : "Reason for Rejection"}
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    reviewMode === "APPROVE"
                      ? "Great hook and seamless product integration!"
                      : "Please ensure the product logo is clear in the first 3 seconds..."
                  }
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
                  required={reviewMode !== "APPROVE"}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedSub(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`text-xs font-bold text-white ${
                    reviewMode === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : reviewMode === "REVISE"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : reviewMode === "APPROVE" ? (
                    "Approve Clip & Credit Reward (Demo)"
                  ) : reviewMode === "REVISE" ? (
                    "Send Revision Request"
                  ) : (
                    "Confirm Rejection"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default BrandCampaignSubmissionsPage

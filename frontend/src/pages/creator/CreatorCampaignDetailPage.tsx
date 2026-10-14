import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { CampaignBrief, CampaignParticipant, ClipSubmission, ClipSubmissionCreate } from "@/types"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Eye,
  Users,
  Video,
  UploadCloud,
  ExternalLink,
  Clock,
  Layers,
  ShieldCheck,
  AlertCircle,
  X,
  Send,
  Loader2,
  Share2,
} from "lucide-react"

export const CreatorCampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<CampaignBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Participation & Submissions state
  const [participation, setParticipation] = useState<CampaignParticipant | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [submissions, setSubmissions] = useState<ClipSubmission[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)

  // Submit Clip Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [clipUrl, setClipUrl] = useState("")
  const [platform, setPlatform] = useState("TIKTOK")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [aiToolsInput, setAiToolsInput] = useState("")
  const [initialViews, setInitialViews] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const loadData = async () => {
    if (!campaignId) return
    setLoading(true)
    setError(null)
    try {
      const brief = await briefsService.getBrief(campaignId)
      setCampaign(brief)

      try {
        const part = await briefsService.getParticipation(campaignId)
        setParticipation(part)
      } catch {
        // Not joined yet
        setParticipation(null)
      }

      setLoadingSubs(true)
      try {
        const subs = await briefsService.listSubmissionsForCampaign(campaignId)
        setSubmissions(subs || [])
      } catch {
        setSubmissions([])
      } finally {
        setLoadingSubs(false)
      }
    } catch (err: any) {
      console.error("Failed to load campaign details:", err)
      setError(err?.message || "Campaign could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [campaignId])

  const handleJoinCampaign = async () => {
    if (!campaignId) return
    setIsJoining(true)
    try {
      await briefsService.joinCampaign(campaignId)
      const part = await briefsService.getParticipation(campaignId)
      setParticipation(part)
      if (campaign) {
        setCampaign({
          ...campaign,
          participants_count: (campaign.participants_count || 0) + 1,
        })
      }
    } catch (err: any) {
      alert(err.message || "Failed to join campaign.")
    } finally {
      setIsJoining(false)
    }
  }

  const handleSubmitClip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignId) return
    setSubmitError(null)

    if (!clipUrl.trim() || !title.trim()) {
      setSubmitError("Please provide both a title and a valid clip URL.")
      return
    }

    setSubmitting(true)
    try {
      const tools = aiToolsInput
        ? aiToolsInput.split(",").map((t) => t.trim()).filter(Boolean)
        : []

      const payload: ClipSubmissionCreate = {
        clip_url: clipUrl.trim(),
        platform,
        title: title.trim(),
        description: description.trim() || undefined,
        ai_tools: tools,
        initial_views: Number(initialViews) || 0,
      }

      const newSub = await briefsService.submitClip(campaignId, payload)
      setSubmissions((prev) => [newSub, ...prev])
      setSubmitSuccess(true)
      setTimeout(() => {
        setSubmitSuccess(false)
        setIsSubmitModalOpen(false)
        setClipUrl("")
        setTitle("")
        setDescription("")
        setAiToolsInput("")
        setInitialViews(0)
      }, 1500)
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit clip.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-sm font-medium">Loading campaign brief...</span>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Campaign Not Available</h2>
          <p className="text-sm text-slate-500">{error || "This campaign does not exist or has been archived."}</p>
          <Link
            to="/creator/campaigns"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const cpmRate = (campaign.cpm_rate_cents || 150) / 100
  const totalPool = (campaign.total_pool_cents || campaign.budget_cents || 1500000) / 100
  const paidPool = (campaign.paid_pool_cents || 0) / 100
  const remainingPool = Math.max(0, totalPool - paidPool)
  const isJoined = Boolean(participation)

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4 sm:px-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/creator/campaigns"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Content Rewards Marketplace</span>
        </Link>
        <span className="text-xs px-3 py-1 rounded-full font-bold bg-purple-100 text-purple-700">
          {campaign.campaign_category || "Content Rewards"}
        </span>
      </div>

      {/* Hero Header Banner */}
      <div className="relative rounded-3xl bg-[#0F0E17] text-white p-6 sm:p-10 border border-slate-800 overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-indigo-950/40 to-transparent pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Reward Campaign
              </span>
              <span className="text-xs text-slate-400">
                {campaign.platforms?.join(" • ") || "TikTok • Instagram • YouTube Shorts"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {campaign.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {campaign.description || campaign.campaign_idea}
            </p>

            {/* Reward Chips */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Reward Rate</div>
                  <div className="text-lg font-black text-white">${cpmRate.toFixed(2)} / 1K views</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <Eye className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Pool</div>
                  <div className="text-lg font-black text-white">${totalPool.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Participants</div>
                  <div className="text-lg font-black text-white">{campaign.participants_count || 12} enrolled</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              {!isJoined ? (
                <button
                  onClick={handleJoinCampaign}
                  disabled={isJoining}
                  className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-bold text-sm hover:bg-purple-100 transition-all shadow-lg shadow-white/10 disabled:opacity-50 flex items-center gap-2"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Join Campaign</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Short-form Clip</span>
                </button>
              )}

              {isJoined && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  You are participating
                </span>
              )}
            </div>
          </div>

          {/* Cover Media Visual */}
          <div className="lg:col-span-4">
            <div className="aspect-video lg:aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
              <ImageWithFallback
                src={campaign.cover_image_url}
                fallbackSrc="/demo-assets/skincare-luxury-serum.jpg"
                alt={campaign.title}
                category={campaign.campaign_category || "Campaign"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Guidelines & Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Guidelines, Requirements, Tools */}
        <div className="lg:col-span-8 space-y-6">
          {/* Creative Guidelines Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              Content Guidelines & Deliverable Specs
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Aspect Ratio</span>
                <div className="text-sm font-extrabold text-slate-900">9:16 Vertical Video</div>
                <p className="text-xs text-slate-500">Optimized for TikTok, Instagram Reels, YouTube Shorts</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolution</span>
                <div className="text-sm font-extrabold text-slate-900">1080x1920 (4K Preferred)</div>
                <p className="text-xs text-slate-500">High-bitrate clear master without compression artifacts</p>
              </div>
            </div>

            {/* Dos and Don'ts */}
            <div className="space-y-4 pt-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                  Things to Include (Dos)
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Engaging hook in the first 2 seconds highlighting the product or concept.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Dynamic motion camera paths and clean sound design/trending audio.</span>
                  </li>
                  {campaign.creative_direction?.things_to_include?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {campaign.creative_direction?.things_to_avoid && campaign.creative_direction.things_to_avoid.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">
                    Things to Avoid (Don'ts)
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    {campaign.creative_direction.things_to_avoid.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Accepted AI Tools */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Recommended & Accepted AI Tools
              </span>
              <div className="flex flex-wrap gap-2">
                {(campaign.required_tools?.length ? campaign.required_tools : ["Runway Gen-3", "Midjourney v6.1", "Flux.1", "Kling AI", "ElevenLabs"]).map(
                  (tool, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200"
                    >
                      {tool}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Creator's Submissions for this Campaign */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Clip Submissions for this Campaign</h2>
                <p className="text-xs text-slate-500">Track verification status, recorded views, and earned rewards</p>
              </div>
              {isJoined && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Submit Another Clip
                </button>
              )}
            </div>

            {loadingSubs ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading your submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
                <Video className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">You haven't submitted any clips for this campaign yet.</p>
                {isJoined ? (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Submit Your First Clip
                  </button>
                ) : (
                  <button
                    onClick={handleJoinCampaign}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-purple-600 transition-colors"
                  >
                    Join to Start Submitting
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{sub.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                          {sub.platform}
                        </span>
                      </div>
                      <a
                        href={sub.clip_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                      >
                        <span>{sub.clip_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {sub.feedback && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                          <strong>Brand Feedback:</strong> {sub.feedback}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-slate-900">
                          {sub.views_count.toLocaleString()} {sub.status === "APPROVED" ? "verified views" : "self-reported views"}
                        </div>
                        <div className="text-xs font-bold text-emerald-600">
                          ${(sub.earned_cents / 100).toFixed(2)} {sub.status === "APPROVED" ? "approved reward (demo)" : "pending review"}
                        </div>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${
                          sub.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : sub.status === "REJECTED"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pool Utilization & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rewards Summary Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Rewards Pool Status
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Allocated Rewards (Demo)</span>
                <span>${paidPool.toLocaleString()} of ${totalPool.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (paidPool / (totalPool || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                CPM Reward Approval Mechanism
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Clip views are audited by the brand sponsor and calculated at ${cpmRate.toFixed(2)} per 1,000 verified views. Approved rewards are credited to your creator balance (Demo simulation).
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reward Structure</span>
                <span className="font-bold text-slate-800">CPM (Cost per 1K Views)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Target Platforms</span>
                <span className="font-bold text-slate-800">TikTok, Reels, Shorts</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Submissions Policy</span>
                <span className="font-bold text-emerald-600">Open to all creators</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Clip Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Submit Clip to Campaign</h3>
              <p className="text-xs text-slate-500">Paste your published short-form video link for brand review and reward tracking.</p>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-slate-900">Clip Submitted Successfully!</h4>
                <p className="text-xs text-slate-500">The brand has been notified and will verify your views.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitClip} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-purple-600"
                  >
                    <option value="TIKTOK">TikTok</option>
                    <option value="INSTAGRAM">Instagram Reels</option>
                    <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clip Title / Hook *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 72-Hour Cellular Glow Morning Routine"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Published Clip URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.tiktok.com/@creator/video/..."
                    value={clipUrl}
                    onChange={(e) => setClipUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AI Tools Used (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Runway Gen-3, Midjourney v6.1, Magnific"
                    value={aiToolsInput}
                    onChange={(e) => setAiToolsInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Self-Reported Initial Views (Unverified)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-1.5">
                    Enter the current public view count from your video platform. Views will be audited and verified upon brand review.
                  </p>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={initialViews}
                    onChange={(e) => setInitialViews(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-purple-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

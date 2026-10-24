import React, { useState, useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { projectsService } from "@/services/projects.service"
import { engagementsService } from "@/services/engagements.service"
import type {
  ProjectWorkspace,
  ProjectMilestone,
  ProjectDeliverable,
  ProjectMessage,
  ProjectStatus,
  Engagement,
  EngagementDetail,
  EngagementDeliverableSubmission,
} from "@/types"
import { ENGAGEMENT_STATUS_META, PRODUCTION_STATUS_META } from "@/lib/engagementStateMachine"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/currency"
import {
  Briefcase,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Layers,
  FileCheck,
  RefreshCw,
  Eye,
  Video,
  Users,
} from "lucide-react"

export const BrandProjectsPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const briefIdFilter = searchParams.get("briefId")

  const [projects, setProjects] = useState<ProjectWorkspace[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected workspace modal / drawer
  const [activeWorkspace, setActiveWorkspace] = useState<ProjectWorkspace | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [activeTab, setActiveTab] = useState<"MILESTONES" | "DELIVERABLES" | "MESSAGES">("MILESTONES")

  // Feature 3.2 Engagement Modals & Detail state
  const [selectedEngagementDetail, setSelectedEngagementDetail] = useState<EngagementDetail | null>(null)
  const [isEngagementDetailOpen, setIsEngagementDetailOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<"ACCEPT" | "REQUEST_CHANGES">("ACCEPT")
  const [reviewNotes, setReviewNotes] = useState("")
  const [qualityScore, setQualityScore] = useState(90)
  const [complianceScore, setComplianceScore] = useState(90)
  const [collaborationScore, setCollaborationScore] = useState(90)
  const [activeReviewSubmission, setActiveReviewSubmission] = useState<EngagementDeliverableSubmission | null>(null)
  const [activeReviewEngagementId, setActiveReviewEngagementId] = useState<string | null>(null)
  const [confirmTermsModalOpen, setConfirmTermsModalOpen] = useState(false)
  const [confirmingEngagement, setConfirmingEngagement] = useState<Engagement | null>(null)
  const [confirmNotes, setConfirmNotes] = useState("")
  const [newProgressNote, setNewProgressNote] = useState("")
  const [newProgressStatus, setNewProgressStatus] = useState<"IN_PROGRESS" | "BLOCKED">("IN_PROGRESS")
  const [blockerExplanation, setBlockerExplanation] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectsData, engagementsData] = await Promise.all([
        projectsService.listProjects().catch(() => []),
        engagementsService.listEngagements(briefIdFilter ? { brief_id: briefIdFilter } : undefined).catch(() => []),
      ])
      setProjects(projectsData || [])
      setEngagements(engagementsData || [])
    } catch (err: any) {
      console.error("Failed to load projects & engagements:", err)
      setError("Unable to load active collaborations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [briefIdFilter])

  // Filter projects by briefId if provided
  const filteredProjects = useMemo(() => {
    if (!briefIdFilter) return projects
    return projects.filter((p) => p.briefId === briefIdFilter)
  }, [projects, briefIdFilter])

  // Handlers for active workspace management
  const handleUpdateMilestoneStatus = async (milestoneId: string, newStatus: "PENDING" | "FUNDED" | "RELEASED") => {
    if (!activeWorkspace) return
    setIsUpdating(true)
    try {
      const updatedMilestones = (activeWorkspace.milestones || []).map((m: any) =>
        m.id === milestoneId ? { ...m, status: newStatus } : m
      )

      // If all milestones released, mark project APPROVED or DELIVERED
      let nextProjectStatus = activeWorkspace.status
      const allReleased = updatedMilestones.length > 0 && updatedMilestones.every((m: any) => m.status === "RELEASED")
      if (allReleased && activeWorkspace.status !== "DELIVERED") {
        nextProjectStatus = "DELIVERED"
      } else if (newStatus === "FUNDED" && activeWorkspace.status === "INITIATED") {
        nextProjectStatus = "IN_PRODUCTION"
      }

      const updated = await projectsService.updateProject(activeWorkspace.id, {
        milestones: updatedMilestones,
        status: nextProjectStatus,
      })

      setActiveWorkspace(updated)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err: any) {
      console.error("Failed to update milestone:", err)
      alert(err.message || "Failed to update milestone status.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateDeliverableStatus = async (
    deliverableId: string,
    newStatus: "PENDING" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED",
    notes?: string
  ) => {
    if (!activeWorkspace) return
    setIsUpdating(true)
    try {
      const updatedDeliverables = (activeWorkspace.deliverables || []).map((d: any) =>
        d.id === deliverableId
          ? {
              ...d,
              status: newStatus,
              notes: notes !== undefined ? notes : d.notes,
            }
          : d
      )

      let nextProjectStatus = activeWorkspace.status
      if (newStatus === "APPROVED") {
        nextProjectStatus = "REVIEW"
      } else if (newStatus === "REVISION_REQUESTED") {
        nextProjectStatus = "REVISION_REQUESTED"
      }

      const updated = await projectsService.updateProject(activeWorkspace.id, {
        deliverables: updatedDeliverables,
        status: nextProjectStatus,
      })

      setActiveWorkspace(updated)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err: any) {
      console.error("Failed to update deliverable:", err)
      alert(err.message || "Failed to update deliverable.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !messageInput.trim()) return
    setIsUpdating(true)
    try {
      const newMessage: ProjectMessage = {
        id: `msg_${Date.now()}`,
        sender_id: user?.id || "brand",
        sender_role: "BRAND",
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
      }

      const updatedMessages = [...(activeWorkspace.messages || []), newMessage]

      const updated = await projectsService.updateProject(activeWorkspace.id, {
        messages: updatedMessages,
      })

      setActiveWorkspace(updated)
      setMessageInput("")
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err: any) {
      console.error("Failed to send message:", err)
      alert(err.message || "Failed to post message.")
    } finally {
      setIsUpdating(false)
    }
  }

  // Feature 3.2: Engagement Lifecycle Handlers
  const handleOpenEngagementDetail = async (engagementId: string) => {
    try {
      const detail = await engagementsService.getEngagementDetail(engagementId)
      setSelectedEngagementDetail(detail)
      setIsEngagementDetailOpen(true)
    } catch (err: any) {
      alert(err.message || "Failed to load engagement detail.")
    }
  }

  const handleConfirmTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmingEngagement) return
    setIsUpdating(true)
    try {
      await engagementsService.confirmTerms(confirmingEngagement.id, {
        confirmed_terms: confirmingEngagement.proposed_terms,
        notes: confirmNotes || "Scope and deliverables confirmed by brand.",
      })
      setConfirmTermsModalOpen(false)
      setConfirmingEngagement(null)
      setConfirmNotes("")
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to confirm engagement scope.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenReviewModal = (engagementId: string, submission: EngagementDeliverableSubmission) => {
    setActiveReviewEngagementId(engagementId)
    setActiveReviewSubmission(submission)
    setReviewDecision("ACCEPT")
    setReviewNotes("")
    setQualityScore(90)
    setComplianceScore(90)
    setCollaborationScore(90)
    setReviewModalOpen(true)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeReviewEngagementId || !activeReviewSubmission) return
    if (reviewDecision === "REQUEST_CHANGES" && (!reviewNotes || reviewNotes.trim().length < 5)) {
      alert("A clear explanation of required changes is required when requesting revisions.")
      return
    }
    setIsUpdating(true)
    try {
      await engagementsService.reviewSubmission(activeReviewEngagementId, activeReviewSubmission.id, {
        decision: reviewDecision,
        review_notes: reviewNotes.trim() || (reviewDecision === "ACCEPT" ? "Approved master deliverables." : "Revision needed."),
        quality_score: qualityScore,
        brief_compliance_score: complianceScore,
        collaboration_score: collaborationScore,
      })
      setReviewModalOpen(false)
      setActiveReviewSubmission(null)
      setActiveReviewEngagementId(null)
      if (selectedEngagementDetail && selectedEngagementDetail.id === activeReviewEngagementId) {
        const refreshed = await engagementsService.getEngagementDetail(activeReviewEngagementId)
        setSelectedEngagementDetail(refreshed)
      }
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to submit review.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePostProgressUpdate = async (engagementId: string) => {
    if (!newProgressNote.trim()) return
    setIsUpdating(true)
    try {
      await engagementsService.updateProgress(engagementId, {
        production_status: newProgressStatus,
        content: newProgressNote.trim(),
        blocker_details: newProgressStatus === "BLOCKED" ? blockerExplanation.trim() : undefined,
      })
      setNewProgressNote("")
      setBlockerExplanation("")
      if (selectedEngagementDetail && selectedEngagementDetail.id === engagementId) {
        const refreshed = await engagementsService.getEngagementDetail(engagementId)
        setSelectedEngagementDetail(refreshed)
      }
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to post progress update.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-[#F4E7FF] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
              Brand Hub
            </span>
            <Badge variant="purple">Active Collaborations</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Brand Projects & Workspaces
          </h1>
          <p className="text-[#4B4652] text-sm mt-1">
            Review creator submissions, release milestone escrow payments, request revisions, and manage production deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/brand/discover">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#D8B8FF] text-[#7B42BC]">
              Discover Talent
            </Button>
          </Link>
          <Link to="/brand/briefs/new">
            <Button variant="primary" size="sm" className="text-xs gap-1.5 bg-gradient-to-r from-[#9A6ADF] to-[#7B42BC] text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New Brief
            </Button>
          </Link>
        </div>
      </div>

      {briefIdFilter && (
        <div className="p-3 bg-[#F4E7FF]/60 border border-[#D8B8FF] rounded-2xl flex items-center justify-between text-xs text-[#7B42BC]">
          <span>Filtered by Brief ID: <strong>{briefIdFilter}</strong></span>
          <Link to="/brand/projects" className="underline font-bold text-xs">
            Clear Filter
          </Link>
        </div>
      )}

      {/* FEATURE 3.2: LIFECYCLE ENGAGEMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Lifecycle Engagements & Deliverable Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                End-to-end management from invitation to production, review, and verified completion.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
            {engagements.length} Total
          </span>
        </div>

        {engagements.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl bg-white border border-purple-100 space-y-2">
            <Briefcase className="w-7 h-7 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No active engagements</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Shortlist creators or send invitations from your campaign briefs to initiate Stage A-E engagements.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {engagements.map((eng) => {
              const statusMeta = ENGAGEMENT_STATUS_META[eng.status] || {
                label: eng.status,
                color: "text-slate-700",
                bg: "bg-slate-100",
                border: "border-slate-200",
              }
              const prodMeta = PRODUCTION_STATUS_META[eng.production_status]

              return (
                <Card
                  key={eng.id}
                  className="p-5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 transition-all shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 overflow-hidden shrink-0">
                        {eng.creator_avatar_url ? (
                          <img src={eng.creator_avatar_url} alt={eng.creator_name || "Creator"} className="w-full h-full object-cover" />
                        ) : (
                          (eng.creator_name || "C").charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{eng.creator_name || "Creator"}</span>
                          {eng.creator_handle && (
                            <span className="text-xs text-slate-400">@{eng.creator_handle}</span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                            {statusMeta.label}
                          </span>
                          {eng.status === "IN_PRODUCTION" && prodMeta && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prodMeta.bg} ${prodMeta.color}`}>
                              ● {prodMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          Campaign: {eng.brief_title || "Creative Brief Collaboration"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {eng.status === "ACCEPTED" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setConfirmingEngagement(eng)
                            setConfirmNotes("")
                            setConfirmTermsModalOpen(true)
                          }}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Terms</span>
                        </Button>
                      )}

                      {eng.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenEngagementDetail(eng.id)}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Submission</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEngagementDetail(eng.id)}
                        className="text-xs font-semibold border-purple-200 text-purple-700 hover:bg-purple-50 gap-1"
                      >
                        <span>Workspace & History</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">
                      Budget: {formatCurrency(eng.confirmed_terms?.budget_cents || eng.proposed_terms?.budget_cents || 250000, "INR")}
                    </span>
                    <span>Revisions: {eng.confirmed_terms?.revision_allowance || eng.proposed_terms?.revision_allowance || 2} allowed</span>
                    <span>Started: {new Date(eng.created_at).toLocaleDateString()}</span>
                    {eng.completed_at && (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed & Verified
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Main Milestone Workspaces */}
      <div className="pt-6 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-3">Milestone Escrow Collaborations</h2>
      {loading ? (
        <div className="p-16 text-center text-[#4B4652] text-xs">
          <div className="h-6 w-6 border-2 border-[#9A6ADF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading project workspaces...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl bg-white border border-[#F4E7FF] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111111]">No active projects yet</h3>
          <p className="text-xs text-[#4B4652] max-w-md mx-auto leading-relaxed">
            Invite creators from the discovery roster or accept campaign proposals to launch dedicated production workspaces with milestone escrow protection.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/brand/campaigns">
              <Button variant="outline" size="sm" className="text-xs">
                View Campaigns
              </Button>
            </Link>
            <Link to="/brand/discover">
              <Button variant="primary" size="sm" className="text-xs bg-gradient-to-r from-[#9A6ADF] to-[#7B42BC] text-white">
                Discover Creators
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((proj) => {
            const milestoneTotal = (proj.milestones || []).reduce(
              (acc: number, m: any) => acc + (m.amount_cents || 0),
              0
            )
            const releasedCount = (proj.milestones || []).filter((m: any) => m.status === "RELEASED").length
            const totalMilestones = (proj.milestones || []).length

            return (
              <Card
                key={proj.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#D8B8FF] transition-all shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-[#111111] text-base">{proj.title}</p>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        proj.status === "DELIVERED" || proj.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : proj.status === "IN_PRODUCTION"
                          ? "bg-purple-50 text-[#7B42BC] border-[#D8B8FF]"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4B4652]">
                    <span className="font-bold text-emerald-700">
                      Budget: {formatCurrency(proj.agreedBudgetCents, "INR", true)}
                    </span>
                    {totalMilestones > 0 && (
                      <span>
                        Milestones: {releasedCount}/{totalMilestones} Released
                      </span>
                    )}
                    {proj.dueDate && (
                      <span className="text-slate-500">
                        Due: {proj.dueDate.substring(0, 10)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveWorkspace(proj)
                      setActiveTab("MILESTONES")
                    }}
                    className="text-xs gap-1.5 bg-[#9A6ADF] hover:bg-[#8852D4] text-white shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Manage Workspace
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      </div>

      {/* Workspace Management Drawer / Modal */}
      <AnimatePresence>
        {activeWorkspace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-[#F4E7FF] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#F4E7FF] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F4E7FF] text-[#7B42BC]">
                      Workspace #{activeWorkspace.id.substring(0, 8)}
                    </span>
                    <Badge variant="purple">{activeWorkspace.status}</Badge>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111111] mt-1">
                    {activeWorkspace.title}
                  </h3>
                  <p className="text-xs text-emerald-700 font-bold mt-0.5">
                    Agreed Budget: {formatCurrency(activeWorkspace.agreedBudgetCents, "INR", true)} (Escrow Protected)
                  </p>
                </div>
                <button
                  onClick={() => setActiveWorkspace(null)}
                  className="p-1 rounded-lg text-[#4B4652] hover:text-[#111111]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[#F4E7FF] pb-2">
                <button
                  onClick={() => setActiveTab("MILESTONES")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === "MILESTONES"
                      ? "bg-[#9A6ADF] text-white shadow-sm"
                      : "text-[#4B4652] hover:text-[#111111]"
                  }`}
                >
                  Milestones Escrow ({activeWorkspace.milestones?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("DELIVERABLES")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === "DELIVERABLES"
                      ? "bg-[#9A6ADF] text-white shadow-sm"
                      : "text-[#4B4652] hover:text-[#111111]"
                  }`}
                >
                  Deliverables Review ({activeWorkspace.deliverables?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("MESSAGES")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === "MESSAGES"
                      ? "bg-[#9A6ADF] text-white shadow-sm"
                      : "text-[#4B4652] hover:text-[#111111]"
                  }`}
                >
                  Messages ({activeWorkspace.messages?.length || 0})
                </button>
              </div>

              {/* TAB 1: MILESTONES */}
              {activeTab === "MILESTONES" && (
                <div className="space-y-3">
                  <p className="text-xs text-[#4B4652]">
                    Milestone escrow holds funds safely until you inspect and approve submitted creative deliverables.
                  </p>
                  {(activeWorkspace.milestones || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#4B4652] bg-slate-50 rounded-2xl">
                      No milestones recorded for this workspace.
                    </div>
                  ) : (
                    activeWorkspace.milestones.map((m: any, idx: number) => {
                      const isReleased = m.status === "RELEASED"
                      const isFunded = m.status === "FUNDED"
                      return (
                        <div
                          key={m.id || idx}
                          className="p-4 rounded-2xl bg-white border border-[#F4E7FF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#111111]">{m.title}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isReleased
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isFunded
                                    ? "bg-purple-50 text-[#7B42BC] border border-[#D8B8FF]"
                                    : "bg-slate-50 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-700 mt-1">
                              {formatCurrency(m.amount_cents, "INR", true)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isFunded && !isReleased && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleUpdateMilestoneStatus(m.id, "FUNDED")}
                                className="text-xs text-[#7B42BC] border-[#D8B8FF]"
                              >
                                Fund Escrow
                              </Button>
                            )}
                            {!isReleased && (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleUpdateMilestoneStatus(m.id, "RELEASED")}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Release Payment
                              </Button>
                            )}
                            {isReleased && (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Paid Out
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* TAB 2: DELIVERABLES */}
              {activeTab === "DELIVERABLES" && (
                <div className="space-y-3">
                  <p className="text-xs text-[#4B4652]">
                    Review assets uploaded by the creator. Approve deliverables or request revisions.
                  </p>
                  {(activeWorkspace.deliverables || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#4B4652] bg-slate-50 rounded-2xl">
                      No deliverables assigned to this workspace.
                    </div>
                  ) : (
                    (activeWorkspace.deliverables || []).map((d: any, idx: number) => {
                      const isApproved = d.status === "APPROVED"
                      const isRevision = d.status === "REVISION_REQUESTED"

                      return (
                        <div
                          key={d.id || idx}
                          className="p-4 rounded-2xl bg-white border border-[#F4E7FF] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#111111]">{d.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isApproved
                                  ? "bg-emerald-50 text-emerald-700"
                                  : isRevision
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-50 text-slate-600"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>

                          {d.notes && (
                            <p className="text-[11px] text-[#4B4652] bg-slate-50 p-2 rounded-xl">
                              Notes: {d.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            {!isApproved && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => {
                                    const notes = prompt("Enter revision instructions for the creator:")
                                    if (notes !== null) {
                                      handleUpdateDeliverableStatus(d.id, "REVISION_REQUESTED", notes)
                                    }
                                  }}
                                  className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                                >
                                  Request Revision
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateDeliverableStatus(d.id, "APPROVED")}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Approve Deliverable
                                </Button>
                              </>
                            )}
                            {isApproved && (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Approved
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* TAB 3: MESSAGES */}
              {activeTab === "MESSAGES" && (
                <div className="space-y-4">
                  <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    {(activeWorkspace.messages || []).length === 0 ? (
                      <p className="text-xs text-center text-[#4B4652] py-4">
                        No messages yet. Send a note to the creator below.
                      </p>
                    ) : (
                      (activeWorkspace.messages || []).map((msg: any) => {
                        const isMe = msg.sender_role === "BRAND"
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[10px] text-slate-400 mb-0.5">
                              {isMe ? "You (Brand)" : "Creator"} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}
                            </span>
                            <div
                              className={`p-3 rounded-2xl text-xs max-w-sm ${
                                isMe
                                  ? "bg-[#9A6ADF] text-white rounded-br-none"
                                  : "bg-white text-slate-900 border border-slate-200 rounded-bl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message or instruction..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#D8B8FF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={isUpdating || !messageInput.trim()}
                      className="text-xs bg-[#9A6ADF] hover:bg-[#8852D4] text-white gap-1"
                    >
                      <Send className="h-3 w-3" />
                      Send
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FEATURE 3.2: CONFIRM SCOPE TERMS MODAL */}
      {confirmTermsModalOpen && confirmingEngagement && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-purple-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Engagement Scope & Terms
              </h3>
              <button
                onClick={() => setConfirmTermsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Both brand and creator must confirm terms before production commences. Confirming locks the agreed budget, revision allowance, and deliverables.
              </p>

              <div className="p-3 bg-purple-50 rounded-xl space-y-1">
                <div className="font-bold text-purple-950">Agreed Scope Baseline:</div>
                <div>Creator: {confirmingEngagement.creator_name || "Creator"}</div>
                <div>Budget: {formatCurrency(confirmingEngagement.proposed_terms?.budget_cents || 250000, "INR")}</div>
                <div>Revision Rounds: {confirmingEngagement.proposed_terms?.revision_allowance || 2}</div>
                <div>Usage Rights: {confirmingEngagement.proposed_terms?.usage_rights || "Commercial digital distribution rights"}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmation Notes or Kickoff Instructions
                </label>
                <textarea
                  rows={3}
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Scope verified. Production approved to commence..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmTermsModalOpen(false)}
                disabled={isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmTermsSubmit}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUpdating ? "Confirming..." : "Confirm & Unlock Production"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3.2: DELIVERABLE REVIEW MODAL */}
      {reviewModalOpen && activeReviewSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-purple-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Review Deliverable: Version {activeReviewSubmission.version_number}
              </h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
                <div className="font-bold text-slate-900">{activeReviewSubmission.title}</div>
                <div className="truncate">
                  Media Asset:{" "}
                  <a
                    href={activeReviewSubmission.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 underline font-medium"
                  >
                    {activeReviewSubmission.media_url}
                  </a>
                </div>
                {activeReviewSubmission.submission_notes && (
                  <div className="text-slate-500">Notes: {activeReviewSubmission.submission_notes}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Review Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("ACCEPT")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      reviewDecision === "ACCEPT"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve & Complete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision("REQUEST_CHANGES")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      reviewDecision === "REQUEST_CHANGES"
                        ? "bg-orange-50 border-orange-500 text-orange-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span>Request Changes</span>
                  </button>
                </div>
              </div>

              {reviewDecision === "ACCEPT" ? (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                  <div className="font-bold text-emerald-900">Achievement Scoring Rubric (0-100)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Quality: {qualityScore}</span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={qualityScore}
                        onChange={(e) => setQualityScore(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Compliance: {complianceScore}</span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={complianceScore}
                        onChange={(e) => setComplianceScore(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Collab: {collaborationScore}</span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={collaborationScore}
                        onChange={(e) => setCollaborationScore(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100">
                  <span className="text-orange-950 font-bold block mb-1">
                    Clear Revision Feedback Required *
                  </span>
                  <span className="text-[11px] text-orange-800 block">
                    Explain specific cuts, timing changes, or creative adjustments needed. The creator will receive this guidance directly.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {reviewDecision === "ACCEPT" ? "Feedback & Commendation" : "Required Changes Explanation *"}
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewDecision === "ACCEPT"
                      ? "Outstanding execution of prompt direction and color palette..."
                      : "Please adjust scene 2 lighting and slow down transitions between 0:10 and 0:15..."
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewModalOpen(false)}
                disabled={isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitReview}
                disabled={isUpdating}
                className={`text-xs font-bold text-white gap-1 ${
                  reviewDecision === "ACCEPT"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isUpdating
                    ? "Submitting..."
                    : reviewDecision === "ACCEPT"
                    ? "Approve & Complete"
                    : "Submit Revision Request"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3.2: ENGAGEMENT DETAILS & AUDIT TIMELINE DRAWER */}
      {isEngagementDetailOpen && selectedEngagementDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full max-w-xl w-full p-6 space-y-5 overflow-y-auto shadow-2xl border-l border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Engagement Workspace & Audit Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: {selectedEngagementDetail.id}
                </p>
              </div>
              <button
                onClick={() => setIsEngagementDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950">Status: {selectedEngagementDetail.status}</span>
                <span className="text-xs font-bold text-purple-700">
                  Production: {selectedEngagementDetail.production_status}
                </span>
              </div>
              <p className="text-xs text-purple-900/80">
                {ENGAGEMENT_STATUS_META[selectedEngagementDetail.status]?.description}
              </p>
            </div>

            {/* Submissions Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-600" />
                <span>Deliverable Submissions ({selectedEngagementDetail.submissions?.length || 0})</span>
              </h4>

              {(!selectedEngagementDetail.submissions || selectedEngagementDetail.submissions.length === 0) ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                  No deliverables submitted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEngagementDetail.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          v{sub.version_number}: {sub.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.review_decision === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700"
                              : sub.review_decision === "CHANGES_REQUESTED"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {sub.review_decision}
                        </span>
                      </div>

                      <div className="truncate">
                        <a
                          href={sub.media_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-600 underline font-medium"
                        >
                          {sub.media_url}
                        </a>
                      </div>

                      {sub.review_notes && (
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                          <strong>Feedback:</strong> {sub.review_notes}
                        </div>
                      )}

                      {sub.review_decision === "PENDING" && selectedEngagementDetail.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReviewModal(selectedEngagementDetail.id, sub)}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold w-full"
                        >
                          Review This Submission
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Production Progress Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Production Progress & Blockers</span>
              </h4>

              {(!selectedEngagementDetail.progress_updates || selectedEngagementDetail.progress_updates.length === 0) ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                  No progress updates logged yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEngagementDetail.progress_updates.map((prog) => (
                    <div
                      key={prog.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700">{prog.sender_role} Update</span>
                        <span>{new Date(prog.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800">{prog.content}</p>
                      {prog.blocker_details && (
                        <div className="p-2 bg-rose-50 rounded text-rose-800 font-medium">
                          <strong>Blocker:</strong> {prog.blocker_details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post update form */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProgressStatus("IN_PROGRESS")}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      newProgressStatus === "IN_PROGRESS"
                        ? "bg-blue-50 border-blue-500 text-blue-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProgressStatus("BLOCKED")}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      newProgressStatus === "BLOCKED"
                        ? "bg-rose-50 border-rose-500 text-rose-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Report Blocker
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={newProgressNote}
                  onChange={(e) => setNewProgressNote(e.target.value)}
                  placeholder="Post brief clarification, feedback, or update..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />

                {newProgressStatus === "BLOCKED" && (
                  <input
                    type="text"
                    value={blockerExplanation}
                    onChange={(e) => setBlockerExplanation(e.target.value)}
                    placeholder="Describe what is blocking production..."
                    className="w-full text-xs p-2 border border-rose-200 rounded-xl focus:outline-hidden"
                  />
                )}

                <Button
                  size="sm"
                  onClick={() => handlePostProgressUpdate(selectedEngagementDetail.id)}
                  disabled={isUpdating || !newProgressNote.trim()}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold w-full"
                >
                  Post Progress Update
                </Button>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Immutable Audit Timeline</span>
              </h4>

              <div className="space-y-2">
                {(selectedEngagementDetail.timeline_events || []).map((ev) => (
                  <div key={ev.id} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-slate-700">{ev.action}</span>
                      <span>{new Date(ev.created_at).toLocaleTimeString()}</span>
                    </div>
                    {ev.details && <p className="text-slate-600 mt-0.5">{ev.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { projectsService } from "@/services/projects.service"
import { engagementsService } from "@/services/engagements.service"
import { DeliveryCheckReportModal } from "@/components/delivery/DeliveryCheckReportModal"
import type {
  ProjectWorkspace,
  ProjectDeliverable,
  ProjectMessage,
  Engagement,
  EngagementDetail,
  EngagementDeliverableSubmission,
  DeliveryCheckReport,
} from "@/types"
import { ENGAGEMENT_STATUS_META, PRODUCTION_STATUS_META } from "@/lib/engagementStateMachine"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/currency"
import {
  Briefcase,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Clock,
  Sparkles,
  Eye,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  MessageSquare,
  UploadCloud,
  ExternalLink,
  Layers,
  ChevronRight,
  ChevronDown,
  Video,
  RotateCcw,
  FileText,
} from "lucide-react"

export const CreatorProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWorkspace[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeWorkspace, setActiveWorkspace] = useState<ProjectWorkspace | null>(null)
  const [activeTab, setActiveTab] = useState<"MILESTONES" | "DELIVERABLES" | "MESSAGES">("MILESTONES")
  const [isUpdating, setIsUpdating] = useState(false)

  // Message chat state
  const [newMessage, setNewMessage] = useState("")

  // Deliverable submission state
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false)
  const [deliverableTitle, setDeliverableTitle] = useState("")
  const [deliverableUrl, setDeliverableUrl] = useState("")
  const [deliverableNotes, setDeliverableNotes] = useState("")
  const [submittingDeliverableId, setSubmittingDeliverableId] = useState<string | null>(null)

  // Feature 3.2 Engagement state
  const [selectedEngagementDetail, setSelectedEngagementDetail] = useState<EngagementDetail | null>(null)
  const [isEngagementDetailOpen, setIsEngagementDetailOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [decliningEngagementId, setDecliningEngagementId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [engagementSubmissionModalOpen, setEngagementSubmissionModalOpen] = useState(false)
  const [submittingEngagementId, setSubmittingEngagementId] = useState<string | null>(null)
  const [engSubTitle, setEngSubTitle] = useState("")
  const [engSubUrl, setEngSubUrl] = useState("")
  const [engSubFormat, setEngSubFormat] = useState("video/mp4")
  const [engSubNotes, setEngSubNotes] = useState("")
  const [engSubFile, setEngSubFile] = useState<File | null>(null)
  const [engSubDeliverableItemId, setEngSubDeliverableItemId] = useState("")
  const [activeDeliveryReport, setActiveDeliveryReport] = useState<DeliveryCheckReport | null>(null)
  const [isDeliveryReportOpen, setIsDeliveryReportOpen] = useState(false)
  const [progressStatus, setProgressStatus] = useState<"IN_PROGRESS" | "BLOCKED">("IN_PROGRESS")
  const [progressNote, setProgressNote] = useState("")
  const [blockerNote, setBlockerNote] = useState("")

  const loadData = async () => {
    setLoading(true)
    try {
      const [projData, engData] = await Promise.all([
        projectsService.listProjects().catch(() => []),
        engagementsService.listEngagements().catch(() => []),
      ])
      setProjects(projData || [])
      setEngagements(engData || [])
      if (activeWorkspace) {
        const refreshed = (projData || []).find((p: any) => p.id === activeWorkspace.id)
        if (refreshed) setActiveWorkspace(refreshed)
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handlers for Feature 3.2 Engagements
  const handleAcceptInvitation = async (engagementId: string) => {
    setIsUpdating(true)
    try {
      await engagementsService.respondToInvitation(engagementId, { action: "ACCEPT" })
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to accept engagement invitation.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeclineInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!decliningEngagementId) return
    setIsUpdating(true)
    try {
      await engagementsService.respondToInvitation(decliningEngagementId, {
        action: "DECLINE",
        decline_reason: declineReason.trim() || "Creator unavailable for current project timeframe.",
      })
      setDeclineModalOpen(false)
      setDecliningEngagementId(null)
      setDeclineReason("")
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to decline invitation.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStartProduction = async (engagementId: string) => {
    setIsUpdating(true)
    try {
      await engagementsService.startProduction(engagementId)
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to initiate production.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenEngagementDetail = async (engagementId: string) => {
    try {
      const detail = await engagementsService.getEngagementDetail(engagementId)
      setSelectedEngagementDetail(detail)
      setIsEngagementDetailOpen(true)
    } catch (err: any) {
      alert(err.message || "Failed to load engagement details.")
    }
  }

  const handleEngagementDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submittingEngagementId || !engSubTitle.trim() || (!engSubUrl.trim() && !engSubFile)) return
    setIsUpdating(true)
    try {
      let submission: EngagementDeliverableSubmission
      if (engSubFile) {
        submission = await engagementsService.submitDeliverableFile(
          submittingEngagementId,
          engSubFile,
          engSubTitle.trim(),
          {
            deliverableItemId: engSubDeliverableItemId || undefined,
            fileFormat: engSubFormat,
            submissionNotes: engSubNotes.trim() || undefined,
          }
        )
      } else {
        submission = await engagementsService.submitDeliverable(submittingEngagementId, {
          title: engSubTitle.trim(),
          media_url: engSubUrl.trim(),
          file_format: engSubFormat,
          deliverable_item_id: engSubDeliverableItemId || undefined,
          submission_notes: engSubNotes.trim() || undefined,
        })
      }

      setEngagementSubmissionModalOpen(false)
      setSubmittingEngagementId(null)
      setEngSubTitle("")
      setEngSubUrl("")
      setEngSubFile(null)
      setEngSubDeliverableItemId("")
      setEngSubNotes("")

      if (submission?.delivery_check_report) {
        setActiveDeliveryReport(submission.delivery_check_report)
        setIsDeliveryReportOpen(true)
      }

      if (selectedEngagementDetail && selectedEngagementDetail.id === submittingEngagementId) {
        const refreshed = await engagementsService.getEngagementDetail(submittingEngagementId)
        setSelectedEngagementDetail(refreshed)
      }
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to submit deliverable.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePostCreatorProgressUpdate = async (engagementId: string) => {
    if (!progressNote.trim()) return
    setIsUpdating(true)
    try {
      await engagementsService.updateProgress(engagementId, {
        production_status: progressStatus,
        content: progressNote.trim(),
        blocker_details: progressStatus === "BLOCKED" ? blockerNote.trim() : undefined,
      })
      setProgressNote("")
      setBlockerNote("")
      if (selectedEngagementDetail && selectedEngagementDetail.id === engagementId) {
        const refreshed = await engagementsService.getEngagementDetail(engagementId)
        setSelectedEngagementDetail(refreshed)
      }
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to log progress update.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !newMessage.trim()) return
    setIsUpdating(true)
    try {
      const msgObj: ProjectMessage = {
        id: `msg_${Date.now()}`,
        sender_id: "CREATOR",
        sender_role: "CREATOR",
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      }
      const updatedMessages: ProjectMessage[] = [...(activeWorkspace.messages || []), msgObj]
      const updated = await projectsService.updateProject(activeWorkspace.id, {
        messages: updatedMessages,
      })
      setActiveWorkspace(updated)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setNewMessage("")
    } catch (err: any) {
      console.error("Failed to send message:", err)
      alert(err.message || "Failed to send message.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSubmitDeliverable = async (deliverableId: string, url: string, notes: string) => {
    if (!activeWorkspace) return
    setIsUpdating(true)
    try {
      const updatedDeliverables: ProjectDeliverable[] = (activeWorkspace.deliverables || []).map((d) =>
        d.id === deliverableId
          ? {
              ...d,
              status: "SUBMITTED" as const,
              asset_url: url || d.asset_url,
              notes: notes || d.notes,
              submitted_at: new Date().toISOString(),
            }
          : d
      )

      // Notify in messages
      const autoMsg: ProjectMessage = {
        id: `msg_${Date.now()}`,
        sender_id: "CREATOR",
        sender_role: "CREATOR",
        content: `Submitted deliverable for review: ${url || "Asset package"} - ${notes || "Ready for review"}`,
        timestamp: new Date().toISOString(),
      }

      const updated = await projectsService.updateProject(activeWorkspace.id, {
        deliverables: updatedDeliverables,
        messages: [...(activeWorkspace.messages || []), autoMsg],
        status: "REVIEW",
      })

      setActiveWorkspace(updated)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setSubmittingDeliverableId(null)
      setDeliverableUrl("")
      setDeliverableNotes("")
    } catch (err: any) {
      console.error("Failed to submit deliverable:", err)
      alert(err.message || "Failed to submit deliverable.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddNewDeliverable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !deliverableTitle.trim()) return
    setIsUpdating(true)
    try {
      const newDeliv: ProjectDeliverable = {
        id: `deliv_${Date.now()}`,
        title: deliverableTitle.trim(),
        asset_url: deliverableUrl.trim(),
        notes: deliverableNotes.trim(),
        status: (deliverableUrl.trim() ? "SUBMITTED" : "PENDING") as "SUBMITTED" | "PENDING",
      }

      const updatedDeliverables: ProjectDeliverable[] = [...(activeWorkspace.deliverables || []), newDeliv]
      const updated = await projectsService.updateProject(activeWorkspace.id, {
        deliverables: updatedDeliverables,
      })

      setActiveWorkspace(updated)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setDeliverableModalOpen(false)
      setDeliverableTitle("")
      setDeliverableUrl("")
      setDeliverableNotes("")
    } catch (err: any) {
      console.error("Failed to add deliverable:", err)
      alert(err.message || "Failed to add deliverable.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="border-b border-[#F4E7FF] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
            Creator Hub
          </span>
          <Badge variant="purple">Commercial Engagements</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
          Active Projects & Briefs
        </h1>
        <p className="text-[#4B4652] text-sm mt-1">
          Manage campaign deliverables, review milestones, and collaborate with commercial brands.
        </p>
      </div>

      {/* FEATURE 3.2: INCOMING ENGAGEMENT INVITATIONS (STAGE B) */}
      {engagements.filter((e) => e.status === "INVITED").length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Incoming Campaign Invitations ({engagements.filter((e) => e.status === "INVITED").length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {engagements
              .filter((e) => e.status === "INVITED")
              .map((inv) => (
                <Card
                  key={inv.id}
                  className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-white to-purple-50/50 border border-blue-200 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          {inv.brief_title || "Creative Campaign Collaboration"}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          Formal Invitation
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Brand: <strong>{inv.brand_name || "Commercial Brand"}</strong> • Dispatched:{" "}
                        {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(inv.id)}
                        disabled={isUpdating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Invitation</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDecliningEngagementId(inv.id)
                          setDeclineReason("")
                          setDeclineModalOpen(true)
                        }}
                        disabled={isUpdating}
                        className="text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>

                  {inv.invitation_message && (
                    <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-xs text-slate-700 italic">
                      "{inv.invitation_message}"
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-blue-100">
                    <span className="font-bold text-emerald-700">
                      Proposed Budget: {formatCurrency(inv.proposed_terms?.budget_cents || 250000, "INR")}
                    </span>
                    {inv.proposed_terms?.deadline && (
                      <span>Deadline: {new Date(inv.proposed_terms.deadline).toLocaleDateString()}</span>
                    )}
                    <span>Revisions: {inv.proposed_terms?.revision_allowance || 2} rounds</span>
                    <span>Commercial Rights: Required</span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* FEATURE 3.2: ACTIVE ENGAGEMENTS PIPELINE (STAGES C, D, E) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              Production Pipeline
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Active Engagements ({engagements.filter((e) => e.status !== "INVITED").length})
            </h2>
          </div>
        </div>

        {engagements.filter((e) => e.status !== "INVITED").length === 0 ? (
          <Card className="p-8 text-center rounded-2xl bg-white border border-purple-100 space-y-2">
            <Briefcase className="w-7 h-7 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No active engagements</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Invitations accepted from brands will appear here as confirmed production workspaces.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {engagements
              .filter((e) => e.status !== "INVITED")
              .map((eng) => {
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
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">
                            {eng.brief_title || "Creative Collaboration"}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                            {statusMeta.label}
                          </span>
                          {eng.status === "IN_PRODUCTION" && prodMeta && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prodMeta.bg} ${prodMeta.color}`}>
                              ● {prodMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Brand: <strong>{eng.brand_name || "Commercial Brand"}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {eng.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartProduction(eng.id)}
                            disabled={isUpdating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Start Production</span>
                          </Button>
                        )}

                        {(eng.status === "IN_PRODUCTION" || eng.status === "CHANGES_REQUESTED") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSubmittingEngagementId(eng.id)
                              setEngSubTitle(`${eng.brief_title || "Deliverable"} - Final Cut`)
                              setEngSubUrl("")
                              setEngSubNotes("")
                              setEngagementSubmissionModalOpen(true)
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Submit Deliverables</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEngagementDetail(eng.id)}
                          className="text-xs font-semibold border-purple-200 text-purple-700 hover:bg-purple-50 gap-1"
                        >
                          <span>Workspace</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Notice if changes requested */}
                    {eng.status === "CHANGES_REQUESTED" && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                          <span>Brand Requested Changes on Deliverable</span>
                        </div>
                        <p className="text-[11px] text-orange-800">
                          Review feedback in the workspace drawer, adjust your creative cuts, and upload a new version submission.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-bold text-emerald-700">
                        Confirmed Budget: {formatCurrency(eng.confirmed_terms?.budget_cents || eng.proposed_terms?.budget_cents || 250000, "INR")}
                      </span>
                      <span>Revision Allowance: {eng.confirmed_terms?.revision_allowance || 2}</span>
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

      {/* Legacy Milestone Projects */}
      <div className="pt-6 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-3">Milestone Escrow Projects</h2>
        {projects.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl bg-white border border-[#F4E7FF] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111111]">No active projects yet</h3>
          <p className="text-xs text-[#4B4652] max-w-md mx-auto leading-relaxed">
            Projects are initiated when brands review your verified portfolio and accept campaign proposals. Keep your profile complete to rank higher in brand matching.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/creator/portfolio">
              <Button variant="outline" size="sm" className="text-xs">
                Enhance Portfolio
              </Button>
            </Link>
            <Link to="/creator/profile">
              <Button variant="primary" size="sm" className="text-xs">
                Review Profile
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <Card
              key={proj.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#D8B8FF] transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#111111] text-base">{proj.title}</p>
                  <Badge variant="purple">{proj.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#4B4652]">
                  <span className="font-mono font-semibold text-emerald-700">
                    Budget: {formatCurrency(proj.agreedBudgetCents, "INR", true)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    Due: {proj.dueDate ? new Date(proj.dueDate).toLocaleDateString() : "Flexible"}
                  </span>
                  <span className="text-purple-600 font-medium">
                    {proj.deliverables?.length || 0} Deliverables
                  </span>
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
                  className="text-xs gap-1.5 bg-[#9A6ADF] hover:bg-[#8852D4] text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Open Workspace
                </Button>
              </div>
            </Card>
          ))}
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
                  Deliverables Submissions ({activeWorkspace.deliverables?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("MESSAGES")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === "MESSAGES"
                      ? "bg-[#9A6ADF] text-white shadow-sm"
                      : "text-[#4B4652] hover:text-[#111111]"
                  }`}
                >
                  Brand Messages ({activeWorkspace.messages?.length || 0})
                </button>
              </div>

              {/* TAB 1: MILESTONES */}
              {activeTab === "MILESTONES" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      Smart Escrow Protection Guarantee
                    </span>
                    <span className="text-[11px] text-purple-700">Funds released upon brand acceptance</span>
                  </div>

                  {(!activeWorkspace.milestones || activeWorkspace.milestones.length === 0) ? (
                    <div className="p-6 text-center text-xs text-[#4B4652] bg-slate-50 rounded-2xl">
                      No explicit milestones configured for this project.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeWorkspace.milestones.map((m: any, idx: number) => {
                        const isReleased = m.status === "RELEASED"
                        const isFunded = m.status === "FUNDED"
                        return (
                          <div
                            key={m.id || idx}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                              isReleased
                                ? "bg-emerald-50/40 border-emerald-200"
                                : isFunded
                                ? "bg-purple-50/30 border-purple-200"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-[#111111]">{m.title}</p>
                              <p className="text-[11px] text-[#4B4652]">
                                {formatCurrency(m.amount_cents, "INR", true)} •{" "}
                                <span
                                  className={`font-semibold ${
                                    isReleased
                                      ? "text-emerald-700"
                                      : isFunded
                                      ? "text-purple-700"
                                      : "text-amber-700"
                                  }`}
                                >
                                  {m.status || "PENDING"}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isReleased ? (
                                <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                                  Paid Out
                                </Badge>
                              ) : isFunded ? (
                                <Badge variant="purple" className="text-[10px]">
                                  Escrow Funded
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-amber-700">
                                  Pending Brand Deposit
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DELIVERABLES */}
              {activeTab === "DELIVERABLES" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Project Deliverables</span>
                    <button
                      onClick={() => setDeliverableModalOpen(true)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Add Custom Deliverable
                    </button>
                  </div>

                  {(!activeWorkspace.deliverables || activeWorkspace.deliverables.length === 0) ? (
                    <div className="p-8 text-center text-xs text-[#4B4652] bg-slate-50 rounded-2xl space-y-2">
                      <p>No deliverables listed yet.</p>
                      <button
                        onClick={() => setDeliverableModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600"
                      >
                        Submit First Deliverable
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeWorkspace.deliverables.map((d: any, idx: number) => {
                        const isSubmitting = submittingDeliverableId === d.id
                        return (
                          <div
                            key={d.id || idx}
                            className="p-4 rounded-2xl bg-white border border-[#F4E7FF] space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-xs font-bold text-[#111111]">{d.title}</span>
                                {d.format && (
                                  <span className="text-[10px] ml-2 text-slate-400">({d.format})</span>
                                )}
                              </div>
                              <Badge
                                variant={
                                  d.status === "APPROVED"
                                    ? "success"
                                    : d.status === "REVISION_REQUESTED"
                                    ? "peach"
                                    : "purple"
                                }
                                className="text-[10px]"
                              >
                                {d.status || "PENDING"}
                              </Badge>
                            </div>

                            {d.notes && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                                <strong>Notes:</strong> {d.notes}
                              </p>
                            )}

                            {(d.asset_url || (d as any).media_url) && (
                              <div className="flex items-center gap-2 pt-1">
                                <a
                                  href={d.asset_url || (d as any).media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Submitted Asset
                                </a>
                              </div>
                            )}

                            {isSubmitting ? (
                              <div className="pt-2 border-t border-slate-100 space-y-2">
                                <input
                                  type="url"
                                  placeholder="Asset URL (e.g. Google Drive, Frame.io, Cloud link)..."
                                  value={deliverableUrl}
                                  onChange={(e) => setDeliverableUrl(e.target.value)}
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                                />
                                <input
                                  type="text"
                                  placeholder="Submission notes or prompt details..."
                                  value={deliverableNotes}
                                  onChange={(e) => setDeliverableNotes(e.target.value)}
                                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setSubmittingDeliverableId(null)}
                                    className="px-3 py-1 rounded-xl text-xs text-slate-500"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSubmitDeliverable(d.id, deliverableUrl, deliverableNotes)}
                                    disabled={!deliverableUrl.trim()}
                                    className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-purple-600 disabled:opacity-50"
                                  >
                                    Send to Brand
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => {
                                    setSubmittingDeliverableId(d.id)
                                    setDeliverableUrl(d.asset_url || (d as any).media_url || "")
                                    setDeliverableNotes(d.notes || "")
                                  }}
                                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  {d.status === "REVISION_REQUESTED"
                                    ? "Submit Revised Version"
                                    : d.asset_url || (d as any).media_url
                                    ? "Update Submission"
                                    : "Submit Deliverable"}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add New Deliverable Modal Sub-form */}
                  {deliverableModalOpen && (
                    <form onSubmit={handleAddNewDeliverable} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-2.5">
                      <h4 className="text-xs font-bold text-purple-950">Add Deliverable</h4>
                      <input
                        type="text"
                        placeholder="Deliverable Title (e.g. Final 4K Video Commercial)..."
                        value={deliverableTitle}
                        onChange={(e) => setDeliverableTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        required
                      />
                      <input
                        type="url"
                        placeholder="Asset URL (optional)..."
                        value={deliverableUrl}
                        onChange={(e) => setDeliverableUrl(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Notes or technical specifications..."
                        value={deliverableNotes}
                        onChange={(e) => setDeliverableNotes(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setDeliverableModalOpen(false)}
                          className="px-3 py-1 rounded-xl text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!deliverableTitle.trim() || isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 disabled:opacity-50"
                        >
                          Add Deliverable
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: BRAND MESSAGES */}
              {activeTab === "MESSAGES" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 max-h-56 overflow-y-auto space-y-2">
                    {(!activeWorkspace.messages || activeWorkspace.messages.length === 0) ? (
                      <p className="text-xs text-[#4B4652] text-center py-6">
                        No messages yet. Send a message to coordinate with the brand.
                      </p>
                    ) : (
                      activeWorkspace.messages.map((msg: any, idx: number) => {
                        const isCreator = msg.sender_id === "CREATOR"
                        return (
                          <div
                            key={msg.id || idx}
                            className={`p-2.5 rounded-xl text-xs ${
                              isCreator
                                ? "bg-purple-600 text-white ml-auto max-w-[85%]"
                                : "bg-white border border-[#F4E7FF] text-[#111111] mr-auto max-w-[85%]"
                            }`}
                          >
                            <p className={`font-bold text-[10px] mb-0.5 ${isCreator ? "text-purple-200" : "text-purple-700"}`}>
                              {(msg as any).sender_name || (isCreator ? "You (Creator)" : "Brand")}
                            </p>
                            <p>{msg.content}</p>
                            {(msg.timestamp || (msg as any).sent_at) && (
                              <p className={`text-[9px] mt-1 text-right ${isCreator ? "text-purple-200" : "text-slate-400"}`}>
                                {new Date(msg.timestamp || (msg as any).sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message or brief update for the brand..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || isUpdating}
                      variant="primary"
                      size="sm"
                      className="text-xs gap-1.5 bg-[#9A6ADF] hover:bg-[#8852D4] text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FEATURE 3.2: DECLINE INVITATION MODAL */}
      {declineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-rose-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Decline Invitation</h3>
              <button
                onClick={() => setDeclineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please share a brief reason so the brand understands why you cannot accept this collaboration at this time.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decline Reason
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Currently fully booked for this month, or rate requirements differ..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeclineModalOpen(false)}
                disabled={isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeclineInvitationSubmit}
                disabled={isUpdating}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {isUpdating ? "Declining..." : "Decline Collaboration"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3.2: ENGAGEMENT DELIVERABLE SUBMISSION MODAL */}
      {engagementSubmissionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-purple-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Submit Deliverable for Review</h3>
              <button
                onClick={() => setEngagementSubmissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Upload your completed render or share your master 4K delivery link. Submissions increment your deliverable version and notify the brand review team.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  value={engSubTitle}
                  onChange={(e) => setEngSubTitle(e.target.value)}
                  placeholder="e.g. Master Cut v1 — 4K 9:16 Cinematic Video"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Deliverable File (Instant Server-Side Binary Inspection)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,image/png,image/jpeg,image/webp,application/zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setEngSubFile(file)
                      if (file && !engSubTitle) {
                        setEngSubTitle(file.name.replace(/\.[^/.]+$/, ""))
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-slate-200 rounded-xl p-1.5"
                  />
                  {engSubFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEngSubFile(null)}
                      className="text-xs text-slate-400 hover:text-rose-600 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {engSubFile ? (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    ✓ Selected: {engSubFile.name} ({(engSubFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload your raw deliverable for binary verification (resolution, aspect ratio, duration, codecs).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Media Asset / Storage URL {!engSubFile && "*"}
                </label>
                <input
                  type="url"
                  value={engSubUrl}
                  onChange={(e) => setEngSubUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {selectedEngagementDetail?.confirmed_terms?.deliverables && selectedEngagementDetail.confirmed_terms.deliverables.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matching Brief Deliverable Requirement
                  </label>
                  <select
                    value={engSubDeliverableItemId}
                    onChange={(e) => setEngSubDeliverableItemId(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                  >
                    <option value="">Auto-match against brief requirements</option>
                    {selectedEngagementDetail.confirmed_terms.deliverables.map((rawItem: any, idx) => {
                      const item = rawItem as Record<string, any>
                      const valId = String(item.id || `item_${idx}`)
                      const dTitle = String(item.title || item.type || `Deliverable #${idx + 1}`)
                      const dFmt = String(item.format || "any")
                      const dRatio = String(item.aspect_ratio || "any")
                      const dRes = String(item.resolution || "any")
                      return (
                        <option key={valId} value={valId}>
                          Deliverable #{idx + 1}: {dTitle} ({dFmt}, {dRatio}, {dRes})
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    File Format
                  </label>
                  <select
                    value={engSubFormat}
                    onChange={(e) => setEngSubFormat(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                  >
                    <option value="video/mp4">MP4 (H.264 / H.265)</option>
                    <option value="video/quicktime">ProRes (MOV)</option>
                    <option value="image/png">High-Res PNG</option>
                    <option value="application/zip">Asset Archive (ZIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Notes & Creative Context
                </label>
                <textarea
                  rows={2}
                  value={engSubNotes}
                  onChange={(e) => setEngSubNotes(e.target.value)}
                  placeholder="Notes on generation seeds, color grading, audio sync..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEngagementSubmissionModalOpen(false)}
                disabled={isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEngagementDeliverableSubmit}
                disabled={isUpdating || !engSubTitle.trim() || (!engSubUrl.trim() && !engSubFile)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUpdating ? "Submitting..." : "Submit Deliverable"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3.2: CREATOR ENGAGEMENT WORKSPACE & PROGRESS DRAWER */}
      {isEngagementDetailOpen && selectedEngagementDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full max-w-xl w-full p-6 space-y-5 overflow-y-auto shadow-2xl border-l border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Engagement Production Workspace
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

            {/* Scope Summary Banner */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-purple-950">
                <span>Status: {selectedEngagementDetail.status}</span>
                <span>Budget: {formatCurrency(selectedEngagementDetail.confirmed_terms?.budget_cents || 250000, "INR")}</span>
              </div>
              <p className="text-purple-900/80">
                {selectedEngagementDetail.confirmed_terms?.scope_description || "Commercial creative production"}
              </p>
            </div>

            {/* Submissions & Revision History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Deliverable Submissions ({selectedEngagementDetail.submissions?.length || 0})</span>
                </h4>

                {(selectedEngagementDetail.status === "IN_PRODUCTION" || selectedEngagementDetail.status === "CHANGES_REQUESTED") && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSubmittingEngagementId(selectedEngagementDetail.id)
                      setEngSubTitle(`Deliverable Cut v${(selectedEngagementDetail.submissions?.length || 0) + 1}`)
                      setEngSubUrl("")
                      setEngSubNotes("")
                      setEngagementSubmissionModalOpen(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>Upload New Cut</span>
                  </Button>
                )}
              </div>

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
                        <div className="p-2.5 bg-orange-50/70 border border-orange-100 rounded-lg text-orange-900 text-xs space-y-0.5">
                          <strong>Brand Feedback:</strong>
                          <p>{sub.review_notes}</p>
                        </div>
                      )}

                      {/* Delivery Check Status & Summary */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {sub.delivery_check_status === "PASSED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Delivery Check: Passed
                            </span>
                          ) : sub.delivery_check_status === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Delivery Check: Correction Required
                            </span>
                          ) : sub.delivery_check_status === "UNABLE_TO_VERIFY" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Delivery Check: Unverified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Delivery Check: {sub.delivery_check_status || "Pending"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.delivery_check_report && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDeliveryReport(sub.delivery_check_report!)
                                setIsDeliveryReportOpen(true)
                              }}
                              className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Validation Report
                            </button>
                          )}
                          {sub.delivery_check_status === "FAILED" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSubmittingEngagementId(selectedEngagementDetail.id)
                                setEngSubTitle(`Deliverable Cut v${(selectedEngagementDetail.submissions?.length || 0) + 1} (Fix)`)
                                setEngSubUrl("")
                                setEngSubFile(null)
                                setEngSubNotes(`Correction for validation issues in v${sub.version_number}`)
                                setEngagementSubmissionModalOpen(true)
                              }}
                              className="text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Upload Correction
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Production Progress Logs */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Production Progress & Blocker Updates</span>
              </h4>

              {(!selectedEngagementDetail.progress_updates || selectedEngagementDetail.progress_updates.length === 0) ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                  No progress updates logged yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEngagementDetail.progress_updates.map((prog) => (
                    <div
                      key={prog.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700">{prog.sender_role}</span>
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

              {/* Creator Log Update Form */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProgressStatus("IN_PROGRESS")}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      progressStatus === "IN_PROGRESS"
                        ? "bg-blue-50 border-blue-500 text-blue-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressStatus("BLOCKED")}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      progressStatus === "BLOCKED"
                        ? "bg-rose-50 border-rose-500 text-rose-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Flag Blocker
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Post progress update for brand..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />

                {progressStatus === "BLOCKED" && (
                  <input
                    type="text"
                    value={blockerNote}
                    onChange={(e) => setBlockerNote(e.target.value)}
                    placeholder="Describe what you are awaiting or blocked by..."
                    className="w-full text-xs p-2 border border-rose-200 rounded-xl focus:outline-hidden"
                  />
                )}

                <Button
                  size="sm"
                  onClick={() => handlePostCreatorProgressUpdate(selectedEngagementDetail.id)}
                  disabled={isUpdating || !progressNote.trim()}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold w-full"
                >
                  Log Progress Update
                </Button>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audit Timeline History</span>
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
      {/* FEATURE: DELIVERY CHECK REPORT MODAL */}
      <DeliveryCheckReportModal
        report={activeDeliveryReport}
        isOpen={isDeliveryReportOpen}
        onClose={() => setIsDeliveryReportOpen(false)}
        onRetry={() => {
          setIsDeliveryReportOpen(false)
          setEngagementSubmissionModalOpen(true)
        }}
      />
    </div>
  )
}

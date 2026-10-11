import React, { useState, useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { projectsService } from "@/services/projects.service"
import type {
  ProjectWorkspace,
  ProjectMilestone,
  ProjectDeliverable,
  ProjectMessage,
  ProjectStatus,
} from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"

export const BrandProjectsPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const briefIdFilter = searchParams.get("briefId")

  const [projects, setProjects] = useState<ProjectWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected workspace modal / drawer
  const [activeWorkspace, setActiveWorkspace] = useState<ProjectWorkspace | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [activeTab, setActiveTab] = useState<"MILESTONES" | "DELIVERABLES" | "MESSAGES">("MILESTONES")

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectsService.listProjects()
      setProjects(data || [])
    } catch (err: any) {
      console.error("Failed to load projects:", err)
      setError("Unable to load active project collaborations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

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

      {/* Main Content */}
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
                      Budget: ${(proj.agreedBudgetCents / 100).toLocaleString()}
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
                    Agreed Budget: ${(activeWorkspace.agreedBudgetCents / 100).toLocaleString()} USD
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
                              ${((m.amount_cents || 0) / 100).toLocaleString()} USD
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
    </div>
  )
}

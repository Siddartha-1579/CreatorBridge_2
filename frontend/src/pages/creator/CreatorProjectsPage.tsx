import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { projectsService } from "@/services/projects.service"
import type { ProjectWorkspace, ProjectDeliverable, ProjectMessage } from "@/types"
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
} from "lucide-react"

export const CreatorProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWorkspace[]>([])
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

  const loadProjects = () => {
    projectsService
      .listProjects()
      .then((data) => {
        setProjects(data || [])
        setLoading(false)
        if (activeWorkspace) {
          const refreshed = (data || []).find((p) => p.id === activeWorkspace.id)
          if (refreshed) setActiveWorkspace(refreshed)
        }
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

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

      {loading ? (
        <div className="p-16 text-center text-[#4B4652] text-xs">
          <div className="h-6 w-6 border-2 border-[#9A6ADF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading active projects...</span>
        </div>
      ) : projects.length === 0 ? (
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
    </div>
  )
}

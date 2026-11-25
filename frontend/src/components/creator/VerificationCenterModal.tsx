import React, { useState } from "react"
import type { VerificationBadge, VerificationType } from "@/types"
import { creatorsService } from "@/services/creators.service"
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  ArrowRight,
  Loader2,
  Mail,
  Wrench,
  Layers,
  FileCheck,
  UserCheck,
  Award,
} from "lucide-react"

interface VerificationCenterModalProps {
  isOpen: boolean
  onClose: () => void
  badges: VerificationBadge[]
  onBadgeUpdated: () => void
}

export const VerificationCenterModal: React.FC<VerificationCenterModalProps> = ({
  isOpen,
  onClose,
  badges,
  onBadgeUpdated,
}) => {
  const [selectedType, setSelectedType] = useState<VerificationType | null>(null)
  const [targetId, setTargetId] = useState("")
  const [evidenceRef, setEvidenceRef] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  if (!isOpen) return null

  const getBadgeIcon = (type: VerificationType) => {
    switch (type) {
      case "EMAIL_VERIFIED":
        return <Mail className="w-5 h-5 text-purple-600" />
      case "TOOL_VERIFIED":
        return <Wrench className="w-5 h-5 text-indigo-600" />
      case "PORTFOLIO_VERIFIED":
        return <FileCheck className="w-5 h-5 text-blue-600" />
      case "WORKFLOW_VERIFIED":
        return <Layers className="w-5 h-5 text-violet-600" />
      case "IDENTITY_VERIFIED":
        return <UserCheck className="w-5 h-5 text-emerald-600" />
      case "EXPERIENCE_VERIFIED":
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <ShieldCheck className="w-5 h-5 text-purple-600" />
    }
  }

  const getBadgeDescription = (type: VerificationType) => {
    switch (type) {
      case "EMAIL_VERIFIED":
        return "Confirms your verified creator account email and communication channel."
      case "TOOL_VERIFIED":
        return "Verifies active commercial subscriptions or API access to generative AI platforms (Runway, Midjourney, ComfyUI, ElevenLabs)."
      case "PORTFOLIO_VERIFIED":
        return "Audits original creation proof and clears full commercial exploitation rights for brand campaigns."
      case "WORKFLOW_VERIFIED":
        return "Audits your multi-stage prompt-to-export reproduction pipeline to ensure consistent commercial deliveries."
      case "IDENTITY_VERIFIED":
        return "Government-issued ID or business entity verification for high-value enterprise campaigns."
      case "EXPERIENCE_VERIFIED":
        return "Verifies previous commercial deliverables and creative campaigns executed for brands or agencies."
    }
  }

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return

    setIsSubmitting(true)
    setFeedbackMessage(null)

    try {
      await creatorsService.submitVerificationClaim({
        verification_type: selectedType,
        target_id: targetId || undefined,
        evidence_reference: evidenceRef || undefined,
        notes: notes || undefined,
      })

      setFeedbackMessage({
        type: "success",
        text: "Verification claim submitted! Review will update your badge status shortly.",
      })
      setSelectedType(null)
      setTargetId("")
      setEvidenceRef("")
      setNotes("")
      onBadgeUpdated()
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to submit verification claim",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Creator Trust & Verification Center</h2>
              <p className="text-xs text-slate-500">
                Earn authentic verification signals that give brands total confidence to hire you.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Privacy Notice Banner */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
            <Lock className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
            <div className="text-xs text-purple-900 leading-relaxed">
              <strong>Zero Leak Privacy Guarantee:</strong> Your verification documents, invoices, and private API references are strictly confidential. Only your verified badge signal is visible to marketplace brands.
            </div>
          </div>

          {feedbackMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {feedbackMessage.text}
            </div>
          )}

          {/* Badges List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Marketplace Verification Signals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((badge, idx) => {
                const isVerified = badge.status === "VERIFIED"
                const isPending = badge.status === "PENDING"
                const isRejected = badge.status === "REJECTED"

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isVerified
                        ? "bg-emerald-50/40 border-emerald-200"
                        : isPending
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-white border-slate-200 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-100">
                          {getBadgeIcon(badge.type)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {badge.label}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {badge.target_id || "Profile verification"}
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isVerified
                            ? "bg-emerald-100 text-emerald-800"
                            : isPending
                            ? "bg-amber-100 text-amber-800"
                            : isRejected
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isVerified && <CheckCircle2 className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {isRejected && <AlertCircle className="w-3 h-3" />}
                        {badge.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {getBadgeDescription(badge.type)}
                    </p>

                    {/* Action button */}
                    {!isVerified && !isPending && (
                      <button
                        onClick={() => setSelectedType(badge.type)}
                        className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200"
                      >
                        <span>Submit Verification Proof</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submission Modal Section if a badge was selected */}
          {selectedType && (
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Submit Evidence for {selectedType.replace(/_/g, " ")}
                </h4>
                <button
                  onClick={() => setSelectedType(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitClaim} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Target Name / Software / Brand (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="e.g. Runway Gen-3, Midjourney Pro, Nike Spec Commercial"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-purple-600 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Evidence Link / Reference URL
                  </label>
                  <input
                    type="text"
                    value={evidenceRef}
                    onChange={(e) => setEvidenceRef(e.target.value)}
                    placeholder="e.g. Google Drive screenshot, Unlisted pipeline video, portfolio asset link"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-purple-600 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Auditor Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide any details to help our team verify your submission quickly."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-purple-600 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedType(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from "react"
import { brandsService } from "@/services/brands.service"
import type { BrandVerificationBadge, BrandVerificationCategory } from "@/types"
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Loader2,
  Mail,
  Globe,
  Building,
  FileCheck,
  ArrowRight,
} from "lucide-react"

interface BrandVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  badges: BrandVerificationBadge[]
  onBadgeUpdated: () => void
}

export const BrandVerificationModal: React.FC<BrandVerificationModalProps> = ({
  isOpen,
  onClose,
  badges,
  onBadgeUpdated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BrandVerificationCategory | null>(null)
  const [targetId, setTargetId] = useState("")
  const [evidenceRef, setEvidenceRef] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  if (!isOpen) return null

  const getBadgeIcon = (cat: BrandVerificationCategory) => {
    switch (cat) {
      case "EMAIL_VERIFIED":
        return <Mail className="w-5 h-5 text-purple-600" />
      case "DOMAIN_VERIFIED":
        return <Globe className="w-5 h-5 text-indigo-600" />
      case "ORGANIZATION_IDENTITY":
        return <Building className="w-5 h-5 text-blue-600" />
      case "BUSINESS_REGISTRATION":
        return <FileCheck className="w-5 h-5 text-emerald-600" />
      default:
        return <ShieldCheck className="w-5 h-5 text-purple-600" />
    }
  }

  const getBadgeDescription = (cat: BrandVerificationCategory) => {
    switch (cat) {
      case "EMAIL_VERIFIED":
        return "Confirms corporate email domain ownership and authorized contact person."
      case "DOMAIN_VERIFIED":
        return "Verifies official company website ownership via DNS TXT or meta-tag verification."
      case "ORGANIZATION_IDENTITY":
        return "Audits corporate incorporation certificates and registered business identity."
      case "BUSINESS_REGISTRATION":
        return "Verifies legal signatory authority and commercial licensing compliance."
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await brandsService.submitVerificationClaim({
        verification_type: selectedCategory,
        target_identifier: targetId || undefined,
        evidence_reference: evidenceRef || undefined,
        notes: notes || undefined,
      })

      setFeedback({
        type: "success",
        text: "Organization verification claim submitted. Our team will audit your claim promptly.",
      })
      setSelectedCategory(null)
      setTargetId("")
      setEvidenceRef("")
      setNotes("")
      onBadgeUpdated()
    } catch (err: any) {
      setFeedback({
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
              <h2 className="text-base font-bold text-slate-900">Organization Trust & Verification</h2>
              <p className="text-xs text-slate-500">
                Establish corporate trust so top AI creators eagerly prioritize your campaign briefs.
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
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Privacy Guarantee */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
            <Lock className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
            <div className="text-xs text-purple-900 leading-relaxed">
              <strong>Corporate Confidentiality:</strong> Uploaded incorporation proofs and tax documents are strictly confidential and encrypted. Only your verified badge status is visible to marketplace creators.
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Badges Grid */}
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
                        {getBadgeIcon(badge.category)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{badge.label}</h4>
                        <span className="text-[11px] text-slate-500">Corporate verification</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    {getBadgeDescription(badge.category)}
                  </p>

                  {!isVerified && !isPending && (
                    <button
                      onClick={() => setSelectedCategory(badge.category)}
                      className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                      <span>Submit Verification</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submission Form */}
          {selectedCategory && (
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Submit Evidence for {selectedCategory.replace(/_/g, " ")}
                </h4>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Domain or Registration Number</label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="e.g. apexmedia.example.com or Corporate CIN"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Evidence Link / Document Reference</label>
                  <input
                    type="text"
                    value={evidenceRef}
                    onChange={(e) => setEvidenceRef(e.target.value)}
                    placeholder="https://drive.google.com/... or registry link"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Auditor Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide any instructions or authorized domain notes..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
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
                      "Submit Verification"
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
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

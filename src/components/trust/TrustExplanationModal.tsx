import React from "react"
import { ShieldCheck, X, AlertTriangle, RefreshCw, FileText, CheckCircle2 } from "lucide-react"

export const TrustExplanationModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Transparent Trust & Demerit System
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evidence-based professional reliability and policy accountability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Pillars */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Four Distinct Trust Concepts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="font-bold text-slate-800">1. Profile Verification</p>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Independent validation of email, domain, and portfolio ownership. Unverified does not mean dishonest.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="font-bold text-slate-800">2. Professional Reliability</p>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Objective delivery metrics: on-time milestones, clear communication, and scope adherence.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="font-bold text-slate-800">3. Confirmed Violations</p>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Documented breaches of platform policies. Allegations or pending reports never deduct points.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="font-bold text-slate-800">4. Demerit History</p>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Transparent ledger of penalties, recovery credits, and appeal decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Mathematical Formula */}
        <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2 text-xs text-purple-950">
          <p className="font-bold text-purple-900">Scoring Baseline & Formula</p>
          <p className="leading-relaxed text-purple-800">
            Newly eligible accounts start at <strong>100</strong> with the status <code className="px-1 py-0.5 bg-purple-100 rounded text-[11px]">"New — insufficient history"</code>.
          </p>
          <div className="p-2.5 rounded-lg bg-white/80 border border-purple-200 font-mono text-[11px] text-purple-900 text-center">
            Trust Score = max(0, min(100, 100 - Active Demerits + Recovery Points))
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 rounded bg-white/70 border border-purple-100">
              <p className="text-[10px] text-slate-500">Minor</p>
              <p className="font-bold text-purple-800">5 pts</p>
            </div>
            <div className="p-2 rounded bg-white/70 border border-purple-100">
              <p className="text-[10px] text-slate-500">Moderate</p>
              <p className="font-bold text-purple-800">15 pts</p>
            </div>
            <div className="p-2 rounded bg-white/70 border border-purple-100">
              <p className="text-[10px] text-slate-500">Major</p>
              <p className="font-bold text-purple-800">30 pts</p>
            </div>
            <div className="p-2 rounded bg-white/70 border border-purple-100">
              <p className="text-[10px] text-slate-500">Critical</p>
              <p className="font-bold text-purple-800">50 pts</p>
            </div>
          </div>
          <p className="text-[11px] text-purple-700 pt-1">
            * Qualifying repeated violations apply recurrence multipliers (1.0x, 1.25x, 1.5x) strictly capped at 50 pts per incident.
          </p>
        </div>

        {/* Recovery & Appeals */}
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-800">Score Restoration & Recovery:</strong> Accounts in good standing earn 5 recovery points for every qualifying 90-day period without confirmed incidents (max 15 points per rolling 12 months). Recovery cannot exceed outstanding active demerits.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-800">Appeals & Reversals:</strong> If an incident is successfully appealed or overturned, the penalty is zeroed out in the incident ledger and your score is deterministically restored.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-800">Protected Characteristics:</strong> Religion, political views, nationality, gender, and the lawful creative use of AI are strictly prohibited from influencing trust scores or marketplace matching.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}

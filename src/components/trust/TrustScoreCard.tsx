import React, { useState, useEffect } from "react"
import { ShieldCheck, Award, Info, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { trustService } from "@/services/trust.service"
import type { TrustScore } from "@/types"
import { TrustExplanationModal } from "./TrustExplanationModal"

export const TrustScoreCard: React.FC<{
  className?: string
  initialData?: TrustScore | null
}> = ({ className = "", initialData = null }) => {
  const [data, setData] = useState<TrustScore | null>(initialData)
  const [loading, setLoading] = useState<boolean>(!initialData)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (!initialData) {
      trustService.getMyTrustScore()
        .then((res) => setData(res))
        .catch((err) => console.error("Failed to load trust score:", err))
        .finally(() => setLoading(false))
    }
  }, [initialData])

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs animate-pulse ${className}`}>
        <div className="h-6 w-48 bg-slate-100 rounded mb-4" />
        <div className="h-16 bg-slate-50 rounded-xl" />
      </div>
    )
  }

  const score = data?.score ?? 100
  const statusLabel = data?.status_label ?? "New — insufficient history"
  const activeDemerits = data?.total_active_demerits ?? 0
  const recoveryPoints = data?.eligible_recovery_points ?? 0
  const badges = data?.verified_badges ?? []

  const getScoreColor = () => {
    if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200"
    if (score >= 70) return "text-purple-700 bg-purple-50 border-purple-200"
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200"
    return "text-rose-700 bg-rose-50 border-rose-200"
  }

  return (
    <>
      <div className={`p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5 ${className}`}>
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Professional Trust & Reliability
              </h3>
              <p className="text-xs text-slate-500">
                Transparent standing based on contract fulfillment and originality
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200/60"
          >
            <Info className="w-3.5 h-3.5 text-purple-600" />
            Policy Guide
          </button>
        </div>

        {/* Score & Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border font-bold text-2xl shrink-0 ${getScoreColor()}`}>
              <span>{score}</span>
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{statusLabel}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeDemerits === 0
                  ? "Zero active policy violations or delivery disputes."
                  : `${activeDemerits} active demerit points on record.`}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
            <div>
              <span className="text-slate-400 block text-[11px]">Active Demerits</span>
              <span className="font-semibold text-slate-800">{activeDemerits} pts</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Recovery Earned</span>
              <span className="font-semibold text-emerald-600">+{recoveryPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Verified Badges */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Verified Platform Badges</span>
            <span className="text-[11px] text-slate-400">{badges.length} active</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {badges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50/70 text-purple-800 border border-purple-200/60"
                title={b.description}
              >
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                {b.title}
              </span>
            ))}
            {badges.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Complete onboarding to claim verification badges.
              </span>
            )}
          </div>
        </div>
      </div>

      <TrustExplanationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

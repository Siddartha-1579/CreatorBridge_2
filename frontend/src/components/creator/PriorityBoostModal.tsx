import React, { useState } from "react"
import { X, Zap, AlertCircle, Clock, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { achievementsService } from "@/services/achievements.service"
import type { PriorityBoost } from "@/types"

interface PriorityBoostModalProps {
  isOpen: boolean
  onClose: () => void
  availablePoints: number
  onSuccess: (boost: PriorityBoost) => void
}

export const PriorityBoostModal: React.FC<PriorityBoostModalProps> = ({
  isOpen,
  onClose,
  availablePoints,
  onSuccess,
}) => {
  const [points, setPoints] = useState<number>(Math.min(50, Math.max(10, availablePoints)))
  const [briefId, setBriefId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  if (!isOpen) return null

  const calculateBonus = (pts: number) => {
    // Formula: min(8.0, pts * 8.0 / 100) -> 10 pts = +0.8, 50 pts = +4.0, 100 pts = +8.0
    return Math.min(8.0, Math.round((pts * 8.0) / 100 * 100) / 100).toFixed(1)
  }

  const handleSpend = async () => {
    setError(null)
    if (points > availablePoints) {
      setError(`Insufficient points. You have ${availablePoints} points available.`)
      return
    }
    if (points < 10 || points > 100) {
      setError("Points spend must be between 10 and 100 points.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        points,
        brief_id: briefId.trim() ? briefId.trim() : undefined,
      }
      const res = await achievementsService.createPriorityBoost(payload)
      setSuccess(true)
      setTimeout(() => {
        onSuccess(res)
        onClose()
      }, 1200)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to activate priority boost."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const remainingBalance = Math.max(0, availablePoints - points)
  const bonus = calculateBonus(points)
  const durationHours = points < 25 ? 1 : points < 50 ? 6 : points < 100 ? 12 : 24
  const durationLabel = durationHours === 1 ? "1 hour" : durationHours === 24 ? "1 day" : `${durationHours} hours`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#181524] p-6 shadow-2xl border border-[#D8B8FF] dark:border-purple-500/20 space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E7FF] dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F4E7FF] dark:bg-purple-900/30 text-[#9A6ADF] dark:text-purple-300">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] dark:text-zinc-100">Activate Priority Boost</h3>
              <p className="text-xs text-[#4B4652] dark:text-zinc-400">Spend points for temporary candidate ranking priority</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close boost modal"
            className="p-1 rounded-lg text-[#4B4652] dark:text-zinc-400 hover:bg-[#F4E7FF]/50 dark:hover:bg-zinc-800 hover:text-[#111111] dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-[#111111] dark:text-zinc-100">Priority Boost Activated!</h4>
            <p className="text-xs text-[#4B4652] dark:text-zinc-400">
              Your +{bonus} ranking priority bonus is now active for {durationLabel}.
            </p>
          </div>
        ) : (
          <>
            {/* Balance Overview */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFFDFD] dark:bg-[#231C35] border border-[#F4E7FF] dark:border-zinc-800 text-xs">
              <div>
                <span className="text-[#4B4652] dark:text-zinc-400 block text-[11px]">Available Balance</span>
                <span className="text-sm font-bold text-[#111111] dark:text-zinc-100">{availablePoints} pts</span>
              </div>
              <div className="text-right">
                <span className="text-[#4B4652] dark:text-zinc-400 block text-[11px]">Balance After Boost</span>
                <span className="text-sm font-bold text-[#9A6ADF] dark:text-[#B78AF7]">{remainingBalance} pts</span>
              </div>
            </div>

            {/* Point Selection Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111111] dark:text-zinc-200 block">
                Select Points to Spend (10–100 pts; duration depends on points spent)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((preset) => {
                  const isSelected = points === preset
                  const isDisabled = preset > availablePoints
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setPoints(preset)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-[#F4E7FF] dark:bg-purple-900/40 border-[#9A6ADF] text-[#9A6ADF] dark:text-[#B78AF7] shadow-2xs"
                          : "bg-white dark:bg-[#231C35] border-[#D8B8FF]/60 dark:border-zinc-700 text-[#4B4652] dark:text-zinc-300 hover:bg-[#F4E7FF]/30 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {preset} pts
                    </button>
                  )
                })}
              </div>

              {/* Slider for precision */}
              <div className="pt-2">
                <input
                  type="range"
                  min="10"
                  max={Math.min(100, Math.max(10, availablePoints))}
                  step="5"
                  value={points}
                  disabled={availablePoints < 10}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full accent-[#9A6ADF] cursor-pointer"
                />
              </div>
            </div>

            {/* Impact Calculation Preview */}
            <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#9A6ADF] dark:text-[#B78AF7]" />
                  Temporary Priority Impact
                </span>
                <span className="text-[11px] text-[#4B4652] dark:text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration: {durationLabel} based on points spent
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#9A6ADF] dark:text-[#B78AF7] font-mono">+{bonus}</span>
                <span className="block text-[10px] text-[#4B4652] dark:text-zinc-400">Ranking Bonus</span>
              </div>
            </div>

            {/* Optional Brief Scope */}
            <div className="space-y-1.5">
              <label htmlFor="briefId" className="text-xs font-semibold text-[#111111] dark:text-zinc-200 flex items-center justify-between">
                <span>Optional Campaign Scope</span>
                <span className="text-[10px] font-normal text-[#4B4652] dark:text-zinc-400">Leave blank for Global Boost</span>
              </label>
              <input
                id="briefId"
                type="text"
                placeholder="e.g. Brief ID (optional)"
                value={briefId}
                onChange={(e) => setBriefId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8B8FF] dark:border-zinc-700 bg-white dark:bg-[#231C35] text-[#111111] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Transparency Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#231C35] border border-slate-200/80 dark:border-zinc-800 text-[11px] text-[#4B4652] dark:text-zinc-400 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>System Guarantee:</strong> Priority boosts enhance eligible discovery ranking only. Boosts do NOT modify your independent Trust score or guarantee selection over better-fit criteria.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSpend}
                disabled={loading || availablePoints < 10 || points > availablePoints}
                className="gap-1.5"
              >
                {loading ? "Activating..." : `Confirm Boost (${points} pts)`}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

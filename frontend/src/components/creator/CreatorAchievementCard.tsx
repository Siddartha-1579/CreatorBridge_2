import React, { useState, useEffect } from "react"
import { Trophy, Zap, Sparkles, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { achievementsService } from "@/services/achievements.service"
import type { AchievementSummary, PriorityBoost } from "@/types"
import { PriorityBoostModal } from "./PriorityBoostModal"

interface CreatorAchievementCardProps {
  className?: string
}

export const CreatorAchievementCard: React.FC<CreatorAchievementCardProps> = ({ className = "" }) => {
  const [data, setData] = useState<AchievementSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isBoostModalOpen, setIsBoostModalOpen] = useState<boolean>(false)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  const loadAchievements = async () => {
    try {
      const summary = await achievementsService.getMyAchievements()
      setData(summary)
    } catch (err) {
      console.error("Failed to load achievements summary:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAchievements()
  }, [])

  const handleBoostSuccess = (newBoost: PriorityBoost) => {
    loadAchievements()
  }

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs animate-pulse space-y-4 ${className}`}>
        <div className="h-6 w-52 bg-slate-100 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const availablePoints = data?.available_points ?? 0
  const lifetimePoints = data?.lifetime_points ?? 0
  const spentPoints = data?.spent_points ?? 0
  const longTermBonus = data?.long_term_reputation_bonus ?? 0.0
  const activeBoosts = data?.active_boosts ?? []
  const recentAchievements = data?.recent_achievements ?? []

  // Check for active boost bonus
  const activeBoost = activeBoosts.length > 0 ? activeBoosts[0] : null
  const activeBoostBonus = activeBoost
    ? Math.min(8.0, Math.round((activeBoost.points_spent * 8.0) / 100 * 100) / 100).toFixed(1)
    : "0.0"

  const formatExpiry = (isoString: string) => {
    try {
      const expiry = new Date(isoString)
      const now = new Date()
      const diffMs = expiry.getTime() - now.getTime()
      if (diffMs <= 0) return "Expired"
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m remaining`
    } catch {
      return "Active (24h)"
    }
  }

  return (
    <>
      <div className={`p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5 ${className}`}>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Trophy className="w-5 h-5 text-[#9A6ADF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Creator Achievement & Priority
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                  Verified Reputation
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Points earned from verified completed commissions. Activate temporary candidate ranking boosts.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsBoostModalOpen(true)}
            disabled={availablePoints < 10}
            className="text-xs font-semibold gap-1.5 self-start sm:self-auto text-[#9A6ADF] border-[#D8B8FF] hover:bg-[#F4E7FF]/50"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Activate Priority Boost</span>
          </Button>
        </div>

        {/* 4-Stat Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Available Points */}
          <div className="p-3.5 rounded-xl bg-[#FFFDFD] border border-[#F4E7FF] space-y-1">
            <span className="text-slate-400 block text-[11px] font-medium">Available to Spend</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {availablePoints}
              </span>
              <span className="text-[11px] font-semibold text-[#9A6ADF]">pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Spendable balance</p>
          </div>

          {/* 2. Lifetime Points */}
          <div className="p-3.5 rounded-xl bg-[#FFFDFD] border border-[#F4E7FF] space-y-1">
            <span className="text-slate-400 block text-[11px] font-medium">Lifetime Earned</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {lifetimePoints}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">pts</span>
            </div>
            <p className="text-[10px] text-slate-400">Total verified awards</p>
          </div>

          {/* 3. Long-Term Reputation Bonus */}
          <div className="p-3.5 rounded-xl bg-[#FFFDFD] border border-[#F4E7FF] space-y-1">
            <span className="text-slate-400 block text-[11px] font-medium">Reputation Bonus</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-[#9A6ADF] font-mono">
                +{longTermBonus.toFixed(1)}
              </span>
              <span className="text-[10px] font-medium text-slate-400">/ 5.0 max</span>
            </div>
            <p className="text-[10px] text-slate-400">Permanent discovery perk</p>
          </div>

          {/* 4. Active Boost Status */}
          <div className="p-3.5 rounded-xl bg-[#FFFDFD] border border-[#F4E7FF] space-y-1">
            <span className="text-slate-400 block text-[11px] font-medium">Active Priority Boost</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl font-black font-mono ${activeBoost ? "text-amber-600" : "text-slate-400"}`}>
                {activeBoost ? `+${activeBoostBonus}` : "None"}
              </span>
              {activeBoost && <span className="text-[10px] font-medium text-amber-600">/ 8.0</span>}
            </div>
            <p className="text-[10px] text-slate-400">
              {activeBoost ? formatExpiry(activeBoost.expires_at) : "Inactive"}
            </p>
          </div>
        </div>

        {/* Active Boost Detail Alert (if active) */}
        {activeBoost && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <Zap className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Priority Boost Active:</strong> +{activeBoostBonus} candidate ranking priority (spent {activeBoost.points_spent} pts).
                {activeBoost.brief_id ? ` Scoped to Brief ID: ${activeBoost.brief_id}` : " Global Brief Discovery."}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 font-medium shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>{formatExpiry(activeBoost.expires_at)}</span>
            </div>
          </div>
        )}

        {/* Recent Verified Achievements List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Verified Completed Engagements
            </h4>
            <span className="text-[11px] text-slate-400">
              {recentAchievements.length} record{recentAchievements.length === 1 ? "" : "s"}
            </span>
          </div>

          {recentAchievements.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Sparkles className="h-6 w-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No verified completed engagements yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Achievement points are awarded automatically when an authorized brand client reviews and accepts your project deliverable or campaign video clip.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAchievements.map((event) => {
                const isExpanded = expandedEventId === event.id
                const ev = event.evidence || {}
                const completedDate = new Date(event.completed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })

                return (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-[#D8B8FF] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Engagement #{event.source_engagement_id.slice(0, 8)}
                          </p>
                          <p className="text-[11px] text-slate-400">Completed on {completedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#9A6ADF]">
                            +{event.points_awarded} pts
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Score: {event.achievement_score}%
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                          title="Toggle rubric breakdown"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Rubric Breakdown Drawer */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-slate-400 block text-[10px]">Quality (40%)</span>
                          <span className="font-semibold text-slate-800">{ev.quality ?? 85}/100</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-slate-400 block text-[10px]">Timeliness (25%)</span>
                          <span className="font-semibold text-slate-800">{ev.timeliness ?? 100}/100</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-slate-400 block text-[10px]">Brief Compliance (20%)</span>
                          <span className="font-semibold text-slate-800">{ev.brief_compliance ?? 85}/100</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-slate-400 block text-[10px]">Collaboration (15%)</span>
                          <span className="font-semibold text-slate-800">{ev.collaboration ?? 85}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* System Independence Guarantee Note */}
        <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#9A6ADF] shrink-0 mt-0.5" />
          <span>
            <strong>Separation of Concerns:</strong> Achievement points reward verified deliverable quality and provide transparent ranking priority in candidate discovery. Achievement points never modify or erase Trust & Reliability demerits.
          </span>
        </div>
      </div>

      {/* Boost Activation Modal */}
      <PriorityBoostModal
        isOpen={isBoostModalOpen}
        onClose={() => setIsBoostModalOpen(false)}
        availablePoints={availablePoints}
        onSuccess={handleBoostSuccess}
      />
    </>
  )
}

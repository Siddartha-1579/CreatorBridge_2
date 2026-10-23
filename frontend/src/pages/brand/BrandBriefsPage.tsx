import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { briefsService } from "@/services/briefs.service"
import type { CampaignBrief } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Layers,
  Edit3,
  Loader2,
  Eye,
} from "lucide-react"
import {
  BrandBriefInspirationCarousel,
  type BriefTemplate,
} from "@/components/brand/BrandBriefInspirationCarousel"

export const BrandBriefsPage: React.FC = () => {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState<CampaignBrief[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadBriefs = async () => {
    try {
      // Fetch only the authenticated brand's private briefs (drafts and published)
      const myBriefs = await briefsService.listMyBriefs()
      setBriefs(myBriefs || [])
    } catch (err) {
      console.error("Failed to load brand briefs:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBriefs()
  }, [])

  const handleSelectTemplate = (template: BriefTemplate) => {
    // Navigate straight to the AI Brief Builder with preselected template direction
    navigate("/brand/briefs/new")
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campaign Briefs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              {briefs.length} Active
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Build structured AI creative briefs, define technical deliverables, and invite certified creators.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/brand/briefs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Create Brief with AI Builder
          </Link>
        </div>
      </div>

      {/* APPLE CARDS CAROUSEL: BRAND CAMPAIGN INSPIRATION */}
      <BrandBriefInspirationCarousel onSelectTemplate={handleSelectTemplate} />

      {/* Briefs Directory & Management */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Your Creative Initiatives & Drafts
          </h2>
          <span className="text-xs text-slate-500">
            Showing all drafts and published marketplace briefs
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white border border-purple-100">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-xs font-medium">Loading campaign briefs...</span>
          </div>
        ) : briefs.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-white border border-dashed border-purple-200 space-y-3">
            <FileText className="w-10 h-10 text-purple-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No creative briefs created yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Start with our guided AI Creative Brief Builder to synthesize your campaign vision into production specifications.
            </p>
            <Link
              to="/brand/briefs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Build Your First Brief
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {briefs.map((brief) => {
              const isDraft = brief.status === "DRAFT" || brief.status === "READY_TO_PUBLISH"
              const deliverableCount = brief.deliverables?.length || 0
              const budgetAmount = brief.budget_cents || (brief.commercial_terms?.budget_cents) || 0

              return (
                <div
                  key={brief.id}
                  className="p-6 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 shadow-2xs hover:shadow-sm transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {brief.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            brief.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : brief.status === "READY_TO_PUBLISH"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {brief.status.replace(/_/g, " ")}
                        </span>
                        {brief.ai_metadata?.ai_generated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Synthesized
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 max-w-2xl line-clamp-2">
                        {brief.executive_summary || brief.description || brief.campaign_idea}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <Link
                        to={`/brand/briefs/${brief.id}/edit`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {isDraft ? "Continue Editing Draft" : "Edit Brief"}
                      </Link>
                    </div>
                  </div>

                  {/* Metadata Matrix */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                      <span>Budget:</span>
                      <span className="text-purple-700 font-bold">
                        ${(budgetAmount / 100).toLocaleString()} USD
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span>Deliverables:</span>
                      <strong className="text-slate-800">{deliverableCount} items</strong>
                    </div>

                    {brief.target_audience && (
                      <div className="flex items-center gap-1">
                        <span>Audience:</span>
                        <strong className="text-slate-800 truncate max-w-xs">{brief.target_audience}</strong>
                      </div>
                    )}

                    {brief.creative_direction?.styles && brief.creative_direction.styles.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        {brief.creative_direction.styles.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrandBriefsPage

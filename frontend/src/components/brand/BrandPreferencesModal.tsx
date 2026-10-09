import React, { useState, useEffect } from "react"
import { brandsService } from "@/services/brands.service"
import type { BrandPreferences, BrandPreferencesUpdate } from "@/types"
import { X, Layers, Save, Loader2, Check } from "lucide-react"

interface BrandPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  preferences: BrandPreferences | null
  onPreferencesUpdated: () => void
}

export const BrandPreferencesModal: React.FC<BrandPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onPreferencesUpdated,
}) => {
  const [contentReqs, setContentReqs] = useState<string[]>([])
  const [formats, setFormats] = useState<string[]>([])
  const [styles, setStyles] = useState<string[]>([])
  const [styleDesc, setStyleDesc] = useState("")
  const [channels, setChannels] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState("")
  const [engagementType, setEngagementType] = useState("")
  const [commRights, setCommRights] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (preferences) {
      setContentReqs(preferences.content_requirements || [])
      setFormats(preferences.preferred_formats || [])
      setStyles(preferences.creative_styles || [])
      setStyleDesc(preferences.style_description || "")
      setChannels(preferences.intended_usage_channels || [])
      setBudgetRange(preferences.budget_range || "")
      setEngagementType(preferences.engagement_type || "")
      setCommRights(preferences.commercial_rights_required ?? true)
    }
  }, [preferences, isOpen])

  if (!isOpen) return null

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updateData: BrandPreferencesUpdate = {
        content_requirements: contentReqs,
        preferred_formats: formats,
        creative_styles: styles,
        style_description: styleDesc,
        intended_usage_channels: channels,
        budget_range: budgetRange,
        engagement_type: engagementType,
        commercial_rights_required: commRights,
      }
      await brandsService.updateMyPreferences(updateData)
      onPreferencesUpdated()
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update preferences")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Creative Preferences</h2>
              <p className="text-xs text-slate-500">Configure content formats, styles, and commercial parameters.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Preferred Formats */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Preferred Delivery Formats</label>
            <div className="flex flex-wrap gap-2">
              {[
                "9:16 vertical (Mobile First)",
                "16:9 landscape (Commercial / Web)",
                "1:1 square (Feed / Display)",
                "4:5 portrait (Social Feed)",
                "21:9 cinematic (Wide Screen)",
              ].map((fmt) => {
                const selected = formats.includes(fmt)
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleItem(formats, setFormats, fmt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-purple-200"
                    }`}
                  >
                    {fmt}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Creative Styles */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Visual Aesthetic & Styles</label>
            <div className="flex flex-wrap gap-2">
              {[
                "Cinematic & High-Dynamic",
                "Photorealistic & Hyper-real",
                "Minimalist & Clean",
                "Editorial & High Fashion",
                "Futuristic & Cyberpunk",
                "Stylized 3D & Claymation",
                "Surreal & Dreamlike",
                "Product-focused & Packshot Crisp",
              ].map((style) => {
                const selected = styles.includes(style)
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleItem(styles, setStyles, style)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-purple-200"
                    }`}
                  >
                    {style}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Style Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Style Guideline Notes</label>
            <textarea
              value={styleDesc}
              onChange={(e) => setStyleDesc(e.target.value)}
              rows={2}
              placeholder="Describe your brand's preferred lighting, pacing, color palette..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Budget & Engagement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Budget Range</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Select range...</option>
                <option value="Under ₹5,000">Under ₹5,000</option>
                <option value="₹5,000–₹15,000">₹5,000–₹15,000</option>
                <option value="₹15,000–₹50,000">₹15,000–₹50,000</option>
                <option value="₹50,000–₹1,00,000">₹50,000–₹1,00,000</option>
                <option value="Above ₹1,00,000">Above ₹1,00,000</option>
                <option value="Not decided yet">Not decided yet</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Engagement Type</label>
              <select
                value={engagementType}
                onChange={(e) => setEngagementType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Select model...</option>
                <option value="One-time project">One-time project</option>
                <option value="Multi-asset Campaign">Multi-asset Campaign</option>
                <option value="Monthly retainer">Monthly retainer</option>
                <option value="Ongoing creator partnership">Ongoing creator partnership</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

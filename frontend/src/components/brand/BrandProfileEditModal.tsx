import React, { useState, useEffect } from "react"
import { brandsService } from "@/services/brands.service"
import type { BrandProfile, BrandProfileUpdate } from "@/types"
import { X, Building2, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface BrandProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  profile: BrandProfile | null
  onProfileUpdated: () => void
}

export const BrandProfileEditModal: React.FC<BrandProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [companyName, setCompanyName] = useState("")
  const [orgType, setOrgType] = useState("Consumer Brand")
  const [industry, setIndustry] = useState("")
  const [contactName, setContactName] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [teamSize, setTeamSize] = useState("1-10")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || profile.companyName || "")
      setOrgType(profile.organization_type || "Consumer Brand")
      setIndustry(profile.primary_industry || profile.industry || "")
      setContactName(profile.contact_name || "")
      setWebsite(profile.website || "")
      setDescription(profile.description || "")
      setLocation(profile.location || "")
      setTeamSize(profile.team_size || profile.companySize || "1-10")
    }
  }, [profile, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updateData: BrandProfileUpdate = {
        company_name: companyName,
        organization_type: orgType,
        primary_industry: industry,
        contact_name: contactName,
        website,
        description,
        location,
        team_size: teamSize,
      }
      await brandsService.updateMyProfile(updateData)
      onProfileUpdated()
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile")
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
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Organization Profile</h2>
              <p className="text-xs text-slate-500">Update company identity, industry, and contact details.</p>
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Organization Type</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-purple-600"
              >
                <option value="Consumer Brand">Consumer Brand</option>
                <option value="D2C Brand">D2C Brand</option>
                <option value="E-commerce Business">E-commerce Business</option>
                <option value="Startup">Startup</option>
                <option value="Small or Medium Business">Small or Medium Business</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Creative Agency">Creative Agency</option>
                <option value="Advertising Agency">Advertising Agency</option>
                <option value="Production Studio">Production Studio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Primary Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology & SaaS, Fashion, Gaming"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Company Overview & Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What makes your brand unique and what visual tone do you commission?"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Lead Contact</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City / Country"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Team Size</label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="1-10">1-10 people</option>
                <option value="10-50">10-50 people</option>
                <option value="50-200">50-200 people</option>
                <option value="200+">200+ people</option>
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
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

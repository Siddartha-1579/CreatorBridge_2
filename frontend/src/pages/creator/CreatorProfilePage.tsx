import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { creatorsService } from "@/services/creators.service"
import { intelligenceService } from "@/services/intelligence.service"
import type { CreatorProfile, CreatorProfileUpdate, VerificationBadge, ProfileImprovementResponse } from "@/types"
import { VerificationCenterModal } from "@/components/creator/VerificationCenterModal"
import {
  User,
  Wrench,
  Layers,
  ShieldCheck,
  Award,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Sparkles,
  Lightbulb,
} from "lucide-react"

export const CreatorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [badges, setBadges] = useState<VerificationBadge[]>([])
  const [activeTab, setActiveTab] = useState<"identity" | "specialization" | "delivery" | "trust">("identity")

  // Form states
  const [fullName, setFullName] = useState("")
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [hourlyRateDollars, setHourlyRateDollars] = useState<number | string>("")
  const [socialWebsite, setSocialWebsite] = useState("")
  const [socialTwitter, setSocialTwitter] = useState("")
  const [socialInstagram, setSocialInstagram] = useState("")
  const [primarySpec, setPrimarySpec] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [aiTools, setAiTools] = useState<string[]>([])
  const [toolInput, setToolInput] = useState("")
  const [preferredFormats, setPreferredFormats] = useState<string[]>([])
  const [targetNiches, setTargetNiches] = useState<string[]>([])
  const [visibility, setVisibility] = useState("PUBLIC")

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

  // AI Profile Improvement States
  const [isImprovingBio, setIsImprovingBio] = useState(false)
  const [improvementResult, setImprovementResult] = useState<ProfileImprovementResponse | null>(null)
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false)
  const [editableImprovedHeadline, setEditableImprovedHeadline] = useState("")
  const [editableImprovedBio, setEditableImprovedBio] = useState("")

  const handleImproveBioWithAI = async () => {
    if (!bio || bio.trim().length < 5) {
      setErrorMessage("Please enter at least a few words in your bio before optimizing.")
      return
    }
    try {
      setIsImprovingBio(true)
      setErrorMessage(null)
      const res = await intelligenceService.improveProfile({
        original_headline: headline,
        original_bio: bio,
        skills: skills,
        specializations: primarySpec ? [primarySpec] : [],
        ai_tools: aiTools,
        tone: "professional_creative",
      })
      setImprovementResult(res)
      setEditableImprovedHeadline(res.improved_headline || headline)
      setEditableImprovedBio(res.improved_bio)
      setIsImprovementModalOpen(true)
    } catch (err: any) {
      console.error("Failed to improve bio:", err)
      setErrorMessage(err.message || "Failed to generate bio enhancements")
    } finally {
      setIsImprovingBio(false)
    }
  }

  const handleApplyImprovement = () => {
    if (editableImprovedHeadline) setHeadline(editableImprovedHeadline)
    if (editableImprovedBio) setBio(editableImprovedBio)
    setIsImprovementModalOpen(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const loadProfile = async () => {
    try {
      const myProfile = await creatorsService.getMyProfile()
      setProfile(myProfile)
      setFullName(myProfile.full_name || "")
      setHeadline(myProfile.headline || "")
      setBio(myProfile.bio || "")
      setLocation(myProfile.location || "")
      setHourlyRateDollars(myProfile.hourly_rate_cents ? myProfile.hourly_rate_cents / 100 : "")
      setSocialWebsite(myProfile.social_links?.website || "")
      setSocialTwitter(myProfile.social_links?.twitter || "")
      setSocialInstagram(myProfile.social_links?.instagram || "")
      setPrimarySpec(myProfile.primary_specialization || "")
      setSkills(myProfile.skills || [])
      setAiTools(myProfile.ai_tools || [])
      setPreferredFormats(myProfile.preferred_formats || ["16:9 4K", "9:16 Vertical Reel"])
      setTargetNiches(myProfile.target_niches || ["Commercial & Advertising", "Entertainment"])
      setVisibility(myProfile.visibility || "PUBLIC")

      const badgeRes = await creatorsService.getMyVerifications()
      setBadges(badgeRes)
    } catch (err: any) {
      console.error("Error loading profile:", err)
      setErrorMessage(err.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const handleRemoveSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx))
  }

  const handleAddTool = () => {
    if (toolInput.trim() && !aiTools.includes(toolInput.trim())) {
      setAiTools([...aiTools, toolInput.trim()])
      setToolInput("")
    }
  }

  const handleRemoveTool = (idx: number) => {
    setAiTools(aiTools.filter((_, i) => i !== idx))
  }

  const toggleFormat = (fmt: string) => {
    if (preferredFormats.includes(fmt)) {
      setPreferredFormats(preferredFormats.filter((f) => f !== fmt))
    } else {
      setPreferredFormats([...preferredFormats, fmt])
    }
  }

  const toggleNiche = (niche: string) => {
    if (targetNiches.includes(niche)) {
      setTargetNiches(targetNiches.filter((n) => n !== niche))
    } else {
      setTargetNiches([...targetNiches, niche])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setErrorMessage(null)

    try {
      const payload: CreatorProfileUpdate = {
        full_name: fullName,
        headline,
        bio,
        location,
        hourly_rate_cents: hourlyRateDollars ? Math.round(Number(hourlyRateDollars) * 100) : undefined,
        social_links: {
          website: socialWebsite,
          twitter: socialTwitter,
          instagram: socialInstagram,
        },
        primary_specialization: primarySpec,
        skills,
        ai_tools: aiTools,
        preferred_formats: preferredFormats,
        target_niches: targetNiches,
        visibility,
      }

      const updated = await creatorsService.updateMyProfile(payload)
      setProfile(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span>Loading your profile settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Creator Profile & Marketplace Identity
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Customize your professional public profile, certified generative toolchain, and verified trust signals.
          </p>
        </div>

        {profile && (
          <Link
            to={`/creators/${profile.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview as Brand
          </Link>
        )}
      </div>

      {/* Calculated Capability Signals Card (Protected from manual tampering) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Award className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-purple-200 font-bold">
                  Calibrated Tier
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/40 text-purple-100 border border-purple-300/30">
                  Protected System Field
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {profile?.level ? profile.level.replace(/_/g, " ") : "AI EXPLORER"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-purple-200 self-start sm:self-auto">
            <div>
              <span className="block text-[10px] opacity-75">Reputation</span>
              <strong className="text-white text-sm">{profile?.reputation_score ? `${profile.reputation_score} / 5.0` : "4.80 / 5.0"}</strong>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <span className="block text-[10px] opacity-75">Completeness</span>
              <strong className="text-white text-sm">{profile?.profile_completeness_pct || 50}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-purple-100 gap-2">
        <button
          onClick={() => setActiveTab("identity")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "identity"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Identity & Bio
        </button>
        <button
          onClick={() => setActiveTab("specialization")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "specialization"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Specialization & Tools
        </button>
        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "delivery"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Formats & Niches
        </button>
        <button
          onClick={() => setActiveTab("trust")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "trust"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Trust Signals ({badges.filter((b) => b.status === "VERIFIED").length}/6)
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Profile saved successfully! Completeness score updated.
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: IDENTITY & BIO */}
        {activeTab === "identity" && (
          <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Personal & Public Identity</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Display Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Creator Handle (Unique URL slug)</label>
                <input
                  type="text"
                  value={profile?.handle || ""}
                  readOnly
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior AI Cinematographer & Commercial Director"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Creator Bio</label>
                <button
                  type="button"
                  onClick={handleImproveBioWithAI}
                  disabled={isImprovingBio || !bio.trim()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors shadow-2xs disabled:opacity-50"
                  title="Improve headline and bio with AI while strictly preserving verified facts"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isImprovingBio ? "animate-spin text-purple-600" : "text-purple-600"}`} />
                  {isImprovingBio ? "Optimizing Bio..." : "Optimize Bio with AI"}
                </button>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Introduce your background, production philosophy, and AI generation techniques..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Los Angeles, CA / Remote"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Target Hourly Rate (₹ / INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={hourlyRateDollars}
                    onChange={(e) => setHourlyRateDollars(e.target.value)}
                    placeholder="2500"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Online Presence & Links
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="url"
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                  placeholder="Portfolio Website URL"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="url"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  placeholder="X / Twitter URL"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="url"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="Instagram / ArtStation URL"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPECIALIZATION & TOOLS */}
        {activeTab === "specialization" && (
          <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Creative Discipline & AI Toolchain</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Primary Specialization</label>
              <input
                type="text"
                value={primarySpec}
                onChange={(e) => setPrimarySpec(e.target.value)}
                placeholder="e.g. Photorealistic Cinematic Video & Midjourney v6"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {/* Tools Stack */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Generative AI Tools & Platforms</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTool()
                    }
                  }}
                  placeholder="e.g. Runway Gen-3, Midjourney, ComfyUI, ElevenLabs"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTool}
                  className="px-3.5 py-2 rounded-xl bg-purple-100 text-purple-700 font-semibold text-xs hover:bg-purple-200 transition-colors"
                >
                  Add Tool
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiTools.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTool(idx)}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Core Creative Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSkill()
                    }
                  }}
                  placeholder="e.g. Prompt Engineering, Video Consistency, Color Grading"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3.5 py-2 rounded-xl bg-purple-100 text-purple-700 font-semibold text-xs hover:bg-purple-200 transition-colors"
                >
                  Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FORMATS & NICHES */}
        {activeTab === "delivery" && (
          <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Commercial Delivery & Niches</h3>

            {/* Preferred Formats */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Preferred Media Formats</label>
              <div className="flex flex-wrap gap-2">
                {[
                  "16:9 4K (Landscape)",
                  "9:16 Vertical Reel (TikTok/Instagram)",
                  "1:1 Square (Feed)",
                  "4:5 Portrait",
                  "21:9 Ultra-Wide Cinematic",
                  "8K Stills",
                  "Lossless Audio Stems",
                ].map((fmt) => {
                  const selected = preferredFormats.includes(fmt)
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => toggleFormat(fmt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-200"
                      }`}
                    >
                      {fmt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target Niches */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Target Commercial Niches</label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Commercial & Advertising",
                  "Fashion & Luxury",
                  "Tech & SaaS",
                  "Automotive",
                  "Gaming & Esports",
                  "Music & Entertainment",
                  "Architecture & Real Estate",
                  "Food & Beverage",
                ].map((niche) => {
                  const selected = targetNiches.includes(niche)
                  return (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => toggleNiche(niche)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-200"
                      }`}
                    >
                      {niche}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">Marketplace Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="PUBLIC">PUBLIC (Visible to all brands)</option>
                <option value="PRIVATE">PRIVATE (Invitation only)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 4: TRUST SIGNALS */}
        {activeTab === "trust" && (
          <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Marketplace Verification Badges
                </h3>
                <p className="text-xs text-slate-500">
                  Verification signals establish client trust. Badges are verified through audits and tests.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-2xs"
              >
                Open Verification Center
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{badge.label}</h4>
                      <span className="text-[11px] text-slate-500">
                        {badge.status === "VERIFIED" ? "Verified & Authenticated" : "Not yet verified"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      badge.status === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : badge.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {badge.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>

      <VerificationCenterModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        badges={badges}
        onBadgeUpdated={loadProfile}
      />

      {/* AI Bio & Headline Improvement Modal with Side-by-Side Comparison */}
      {isImprovementModalOpen && improvementResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-purple-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    AI Bio & Headline Enhancement
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${improvementResult.is_ai_powered ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>
                      {improvementResult.is_ai_powered ? "Factual AI Optimization" : "Deterministic Fallback"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Side-by-side comparison with strict factual preservation (no fabricated credentials).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImprovementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Preserved Facts & Changes Summary */}
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Preserved Facts & Guardrails
                </div>
                <p className="text-purple-800 text-[11px] leading-relaxed">
                  {improvementResult.changes_summary}
                </p>
                {improvementResult.preserved_facts && improvementResult.preserved_facts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {improvementResult.preserved_facts.map((fact, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-purple-800 border border-purple-200 text-[10px] font-semibold">
                        ✓ {fact}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Side-by-Side Headline Comparison */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Headline Comparison
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Original
                    </span>
                    <p className="text-xs text-slate-700">{headline || "(No headline provided)"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-600 uppercase block mb-1">
                      Improved (Editable)
                    </span>
                    <input
                      type="text"
                      value={editableImprovedHeadline}
                      onChange={(e) => setEditableImprovedHeadline(e.target.value)}
                      className="w-full text-xs font-medium text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-purple-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Side-by-Side Bio Comparison */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bio Comparison
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Original
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{bio}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-600 uppercase block mb-1">
                      Improved (Editable)
                    </span>
                    <textarea
                      rows={5}
                      value={editableImprovedBio}
                      onChange={(e) => setEditableImprovedBio(e.target.value)}
                      className="w-full text-xs font-medium text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-purple-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Suggestions for Missing Info */}
              {improvementResult.missing_info_suggestions && improvementResult.missing_info_suggestions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Recommended Additions (Optional)
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                    {improvementResult.missing_info_suggestions.map((sug, idx) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-purple-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsImprovementModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Discard / Keep Original
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyImprovement}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply Improved Headline & Bio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

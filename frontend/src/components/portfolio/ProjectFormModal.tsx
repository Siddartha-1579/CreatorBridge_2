import React, { useState, useEffect } from "react"
import type {
  PortfolioProject,
  PortfolioProjectCreate,
  PortfolioProjectUpdate,
  AssetType,
  CommercialUseStatus,
  AIGenerationType,
  ProjectVisibility,
  WorkflowStage,
} from "@/types"
import { portfoliosService } from "@/services/portfolios.service"
import {
  X,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Wrench,
  Loader2,
  CheckCircle2,
} from "lucide-react"

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (project: PortfolioProject) => void
  initialProject?: PortfolioProject | null
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const isEditing = Boolean(initialProject)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("AI Video")
  const [contentType, setContentType] = useState("Cinematic Commercial")
  const [mediaType, setMediaType] = useState<AssetType>("VIDEO")
  const [mediaUrl, setMediaUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [tools, setTools] = useState<string[]>([])
  const [toolInput, setToolInput] = useState("")
  const [models, setModels] = useState<string[]>([])
  const [modelInput, setModelInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [resolution, setResolution] = useState("1080p")
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined)
  const [commercialUseStatus, setCommercialUseStatus] = useState<CommercialUseStatus>("COMMERCIAL_READY")
  const [aiGenerationType, setAiGenerationType] = useState<AIGenerationType>("AI_GENERATED")
  const [visibility, setVisibility] = useState<ProjectVisibility>("PUBLIC")
  const [workflowSummary, setWorkflowSummary] = useState("")
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([])

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title || "")
      setDescription(initialProject.description || "")
      setCategory(initialProject.category || "AI Video")
      setContentType(initialProject.content_type || "Cinematic Commercial")
      setMediaType(initialProject.media_type || "VIDEO")
      setMediaUrl(initialProject.media_url || "")
      setThumbnailUrl(initialProject.thumbnail_url || "")
      setTools(initialProject.tools || [])
      setModels(initialProject.models || [])
      setSkills(initialProject.skills || [])
      setAspectRatio(initialProject.aspect_ratio || "16:9")
      setResolution(initialProject.resolution || "1080p")
      setDurationSeconds(initialProject.duration_seconds || undefined)
      setCommercialUseStatus(initialProject.commercial_use_status || "COMMERCIAL_READY")
      setAiGenerationType(initialProject.ai_generation_type || "AI_GENERATED")
      setVisibility(initialProject.visibility || "PUBLIC")
      setWorkflowSummary(initialProject.workflow_summary || "")
      setWorkflowStages(initialProject.workflow_stages || [])
    } else {
      // Default initial states for new project
      setTitle("")
      setDescription("")
      setCategory("AI Video")
      setContentType("Cinematic Commercial")
      setMediaType("VIDEO")
      setMediaUrl("")
      setThumbnailUrl("")
      setTools(["Runway Gen-3", "Midjourney", "ElevenLabs"])
      setModels(["Gen-3 Alpha"])
      setSkills(["Prompt Engineering", "Cinematography"])
      setAspectRatio("16:9")
      setResolution("1080p")
      setDurationSeconds(undefined)
      setCommercialUseStatus("COMMERCIAL_READY")
      setAiGenerationType("AI_GENERATED")
      setVisibility("PUBLIC")
      setWorkflowSummary("Ideated initial concepts and art direction, then synthesized high-fidelity video motion.")
      setWorkflowStages([
        { stage_name: "Concept & Art Direction", description: "Prompting and style exploration", tools_used: ["Midjourney"] },
        { stage_name: "Motion Generation", description: "Camera movement and motion synthesis", tools_used: ["Runway Gen-3"] },
      ])
    }
    setErrorMessage(null)
  }, [initialProject, isOpen])

  if (!isOpen) return null

  const readMediaDuration = (file: File): Promise<number | undefined> =>
    new Promise((resolve) => {
      if (!file.type.startsWith("video/")) {
        resolve(undefined)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      const video = document.createElement("video")
      const finish = (duration?: number) => {
        URL.revokeObjectURL(objectUrl)
        resolve(duration)
      }

      video.preload = "metadata"
      video.onloadedmetadata = () => {
        finish(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined)
      }
      video.onerror = () => finish(undefined)
      video.src = objectUrl
    })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setErrorMessage(null)
    try {
      const duration = await readMediaDuration(file)
      if (duration !== undefined) {
        setDurationSeconds(duration)
      }
      const res = await portfoliosService.uploadAsset(file)
      setMediaUrl(res.public_url)
      if (res.media_type === "IMAGE") {
        setMediaType("IMAGE")
        setThumbnailUrl(res.public_url)
      } else if (res.media_type === "VIDEO") {
        setMediaType("VIDEO")
      } else if (res.media_type === "AUDIO") {
        setMediaType("AUDIO")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload asset file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddTool = () => {
    if (toolInput.trim() && !tools.includes(toolInput.trim())) {
      setTools([...tools, toolInput.trim()])
      setToolInput("")
    }
  }

  const handleRemoveTool = (idx: number) => {
    setTools(tools.filter((_, i) => i !== idx))
  }

  const handleAddStage = () => {
    setWorkflowStages([
      ...workflowStages,
      { stage_name: `Stage ${workflowStages.length + 1}`, description: "", tools_used: [] },
    ])
  }

  const handleUpdateStage = (idx: number, field: keyof WorkflowStage, val: any) => {
    const updated = [...workflowStages]
    updated[idx] = { ...updated[idx], [field]: val }
    setWorkflowStages(updated)
  }

  const handleRemoveStage = (idx: number) => {
    setWorkflowStages(workflowStages.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage("Project title is required")
      return
    }
    if (!mediaUrl.trim()) {
      setErrorMessage("Media URL or uploaded file is required")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      if (isEditing && initialProject) {
        const payload: PortfolioProjectUpdate = {
          title,
          description,
          category,
          content_type: contentType,
          media_type: mediaType,
          media_url: mediaUrl,
          thumbnail_url: thumbnailUrl || mediaUrl,
          tools,
          models,
          skills,
          workflow_summary: workflowSummary,
          workflow_stages: workflowStages,
          aspect_ratio: aspectRatio,
          resolution,
          duration_seconds: durationSeconds ? Number(durationSeconds) : undefined,
          commercial_use_status: commercialUseStatus,
          ai_generation_type: aiGenerationType,
          visibility,
        }
        const updated = await portfoliosService.updateProject(initialProject.id, payload)
        onSave(updated)
      } else {
        const payload: PortfolioProjectCreate = {
          title,
          description,
          category,
          content_type: contentType,
          media_type: mediaType,
          media_url: mediaUrl,
          thumbnail_url: thumbnailUrl || mediaUrl,
          tools,
          models,
          skills,
          workflow_summary: workflowSummary,
          workflow_stages: workflowStages,
          aspect_ratio: aspectRatio,
          resolution,
          duration_seconds: durationSeconds ? Number(durationSeconds) : undefined,
          commercial_use_status: commercialUseStatus,
          ai_generation_type: aiGenerationType,
          visibility,
        }
        const created = await portfoliosService.createProject(payload)
        onSave(created)
      }
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save portfolio project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit AI Showcase Project" : "Add AI Showcase Project"}
            </h2>
            <p className="text-xs text-slate-500">
              Showcase your generative tools, pipeline breakdown, and commercial eligibility to brands.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Title and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Project Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyberpunk Neo-Tokyo Commercial"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
              >
                <option value="AI Video">AI Video</option>
                <option value="AI Image">AI Image</option>
                <option value="AI Animation">AI Animation</option>
                <option value="AI Audio & Voice">AI Audio & Voice</option>
                <option value="Concept Art">Concept Art</option>
                <option value="Storyboard">Storyboard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Content Type</label>
              <input
                type="text"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="e.g. Cinematic Commercial, Social Reel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Media Upload & URL */}
          <div className="space-y-3 p-4 rounded-xl border border-dashed border-purple-200 bg-purple-50/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Media Asset & Upload *
              </label>
              <span className="text-[11px] text-slate-500">MP4, WebM, JPG, PNG, WebP up to 100MB</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Media Type</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as AssetType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="VIDEO">VIDEO</option>
                  <option value="IMAGE">IMAGE</option>
                  <option value="ANIMATION">ANIMATION</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="GRAPHIC">GRAPHIC</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">Upload Media File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                  />
                  {isUploading && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 text-xs text-purple-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Media URL / Cloud Asset</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://... or uploaded above"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-purple-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Poster / Thumbnail URL (Optional)</label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://... image thumbnail"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Project Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What was the creative vision, target tone, and concept behind this piece?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          {/* Tools & Tech Stack */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-purple-600" />
              AI Tools & Platforms
            </label>
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
                placeholder="e.g. Midjourney v6, Runway Gen-3, ElevenLabs"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTool}
                className="px-3.5 py-2 rounded-xl bg-purple-100 text-purple-700 font-medium text-xs hover:bg-purple-200 transition-colors"
              >
                Add Tool
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tools.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200"
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

          {/* Aspect Ratio, Resolution, Duration, Commercial Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Vertical Reel)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Portrait)</option>
                <option value="21:9">21:9 (Cinematic)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="1080p">1080p FHD</option>
                <option value="4K">4K UHD</option>
                <option value="8K">8K</option>
                <option value="720p">720p HD</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Commercial License</label>
              <select
                value={commercialUseStatus}
                onChange={(e) => setCommercialUseStatus(e.target.value as CommercialUseStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="COMMERCIAL_READY">Commercial Ready</option>
                <option value="COMMERCIAL_USE_WITH_PERMISSION">With Permission</option>
                <option value="PERSONAL_PROJECT">Personal Project</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="PUBLIC">PUBLIC (Visible to brands)</option>
                <option value="PRIVATE">PRIVATE (Draft only)</option>
              </select>
            </div>
          </div>

          {/* Multi-Stage Workflow Pipeline Builder */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  Multi-Stage AI Workflow Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">
                  Brands value knowing how you produce and direct AI pipelines from ideation to delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stage
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {workflowStages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-800">Stage {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={stage.stage_name}
                      onChange={(e) => handleUpdateStage(idx, "stage_name", e.target.value)}
                      placeholder="Stage Name (e.g. Concept Art, Motion Synthesis)"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={stage.tools_used.join(", ")}
                      onChange={(e) =>
                        handleUpdateStage(
                          idx,
                          "tools_used",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      placeholder="Tools (e.g. Midjourney, Runway)"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={stage.description}
                    onChange={(e) => handleUpdateStage(idx, "description", e.target.value)}
                    placeholder="Short description of what happens at this stage"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Publish Project"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

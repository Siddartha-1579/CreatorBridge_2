import React, { useEffect, useState } from "react"
import type { PortfolioProject } from "@/types"
import {
  X,
  Play,
  ShieldCheck,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"

const directVideoUrlPattern = /\.(mp4|m4v|mov|webm|ogv|ogg)(?:$|[?#])/i

const isDirectVideoUrl = (url: string) => {
  if (url.startsWith("blob:") || url.startsWith("data:video/")) return true
  return directVideoUrlPattern.test(url)
}

interface ProjectDetailModalProps {
  project: PortfolioProject | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (project: PortfolioProject) => void
  isOwner?: boolean
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
  isOwner = false,
}) => {
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !project) {
      setIsVideoLoading(false)
      setVideoError(null)
      return
    }

    setIsVideoLoading(project.media_type === "VIDEO" || project.media_type === "ANIMATION")
    setVideoError(null)
  }, [isOpen, project])

  if (!isOpen || !project) return null

  const isVideo = project.media_type === "VIDEO" || project.media_type === "ANIMATION"
  const isAudio = project.media_type === "AUDIO"
  const isDirectVideo = isDirectVideoUrl(project.media_url)
  const shouldUseExternalVideoFlow = isVideo && !isDirectVideo
  const externalVideoUrl = project.external_url || project.media_url

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800">
              {project.category}
            </span>
            <span className="text-sm text-slate-500 font-medium">
              {project.content_type}
            </span>
            {project.verification_status === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Commercial Rights
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Media Player / Viewer */}
          <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200 aspect-video flex items-center justify-center">
            {isVideo ? shouldUseExternalVideoFlow ? (
              <div className="max-w-md p-8 text-center space-y-4 text-white">
                <ExternalLink className="w-10 h-10 text-purple-300 mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="font-semibold">This video is hosted externally</h3>
                  <p className="text-sm text-slate-300">
                    Open the creator&apos;s original source to view this portfolio item.
                  </p>
                </div>
                <a
                  href={externalVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
                >
                  Open Original Video
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : videoError ? (
              <div className="max-w-md p-8 text-center space-y-4 text-white" role="alert">
                <AlertCircle className="w-10 h-10 text-amber-300 mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="font-semibold">Video unavailable</h3>
                  <p className="text-sm text-slate-300">{videoError}</p>
                </div>
                <a
                  href={project.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Open Original Media
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <>
                <video
                  key={project.media_url}
                  src={project.media_url}
                  controls
                  poster={project.thumbnail_url}
                  className="w-full h-full object-contain"
                  playsInline
                  preload="metadata"
                  onLoadStart={() => setIsVideoLoading(true)}
                  onLoadedData={() => setIsVideoLoading(false)}
                  onCanPlay={() => setIsVideoLoading(false)}
                  onPlaying={() => setIsVideoLoading(false)}
                  onError={() => {
                    setIsVideoLoading(false)
                    setVideoError("The original media file could not be loaded. Please verify that its URL is available and serves a supported video format.")
                  }}
                />
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-sm text-white pointer-events-none">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading video...
                  </div>
                )}
              </>
            )
            : isAudio ? (
              <div className="w-full p-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Play className="w-10 h-10 fill-current ml-1" />
                </div>
                <audio src={project.media_url} controls className="w-full max-w-md" />
              </div>
            ) : (
              <ImageWithFallback
                src={project.media_url || project.thumbnail_url}
                alt={project.title}
                category={project.category}
                iconType="camera"
                fallbackText={project.title}
                className="w-full h-full object-contain"
                containerClassName="w-full h-full flex items-center justify-center"
              />
            )}
          </div>

          {/* Project Title and Specs Grid */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{project.title}</h2>
              {isOwner && onEdit && (
                <button
                  onClick={() => {
                    onClose()
                    onEdit(project)
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 self-start sm:self-auto"
                >
                  Edit Project
                </button>
              )}
            </div>

            {project.description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Spec metadata pill list */}
            <div className="flex flex-wrap gap-2 pt-2">
              {project.aspect_ratio && (
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                  Ratio: <strong>{project.aspect_ratio}</strong>
                </span>
              )}
              {project.resolution && (
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                  Resolution: <strong>{project.resolution}</strong>
                </span>
              )}
              {project.duration_seconds && (
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                  Duration: <strong>{project.duration_seconds}s</strong>
                </span>
              )}
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {project.commercial_use_status.replace(/_/g, " ")}
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {project.ai_generation_type === "AI_GENERATED" ? "Full Generative Pipeline" : "AI Assisted"}
              </span>
            </div>
          </div>

          {/* AI Tools & Models Used */}
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Generative Tech Stack & Models
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1.5">Software & Platforms</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.tools?.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-purple-800 border border-purple-200 shadow-2xs"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              {project.models && project.models.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 font-medium block mb-1.5">AI Models & Checkpoints</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.models.map((model, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creative Skills */}
          {project.skills && project.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Skills Demonstrated
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Stage AI Production Workflow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                AI Production Workflow & Pipeline
              </h3>
              <span className="text-xs text-slate-400">
                Audited & Reproducible
              </span>
            </div>

            {project.workflow_summary && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                "{project.workflow_summary}"
              </p>
            )}

            {project.workflow_stages && project.workflow_stages.length > 0 ? (
              <div className="space-y-3 pt-2">
                {project.workflow_stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-purple-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {stage.stage_name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    {stage.tools_used && stage.tools_used.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:justify-end shrink-0 pl-9 sm:pl-0">
                        {stage.tools_used.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                No individual workflow stages specified for this asset.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

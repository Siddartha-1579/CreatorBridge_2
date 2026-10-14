import React from "react"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"
import type { PortfolioProject } from "@/types"
import {
  Play,
  Image as ImageIcon,
  Film,
  Music,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"

interface PortfolioProject3DCardProps {
  project: PortfolioProject
  onSelect?: (project: PortfolioProject) => void
  onEdit?: (project: PortfolioProject) => void
  onToggleVisibility?: (project: PortfolioProject) => void
  onDelete?: (project: PortfolioProject) => void
  isOwner?: boolean
}

export const PortfolioProject3DCard: React.FC<PortfolioProject3DCardProps> = ({
  project,
  onSelect,
  onEdit,
  onToggleVisibility,
  onDelete,
  isOwner = false,
}) => {
  const getMediaIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Play className="w-3.5 h-3.5 fill-current" />
      case "IMAGE":
        return <ImageIcon className="w-3.5 h-3.5" />
      case "ANIMATION":
        return <Film className="w-3.5 h-3.5" />
      case "AUDIO":
        return <Music className="w-3.5 h-3.5" />
      default:
        return <Layers className="w-3.5 h-3.5" />
    }
  }

  const isVideo = project.media_type === "VIDEO" || project.media_type === "ANIMATION"

  return (
    <CardContainer className="w-full" containerClassName="py-1">
      <CardBody className="group relative w-full rounded-2xl bg-white border border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden flex flex-col justify-between">
        {/* Subtle decorative purple sheen */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-200/30 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-300/40 transition-colors duration-500" />

        {/* Media Thumbnail Container */}
        <CardItem translateZ={25} className="relative w-full aspect-video overflow-hidden bg-slate-950">
          <ImageWithFallback
            src={project.thumbnail_url || project.media_url}
            alt={project.title}
            category={project.category}
            iconType={
              project.media_type === "VIDEO"
                ? "film"
                : project.media_type === "ANIMATION"
                ? "layers"
                : "camera"
            }
            fallbackText={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            containerClassName="w-full h-full"
          />

          {/* Media overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

          {/* Top badges bar */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
            {/* Media Type & Aspect ratio pill */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-sm">
                {getMediaIcon(project.media_type)}
                {project.media_type}
              </span>
              {project.aspect_ratio && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/50 backdrop-blur-md text-slate-200 border border-white/10">
                  {project.aspect_ratio}
                </span>
              )}
            </div>

            {/* Verification / Commercial status */}
            <div className="flex items-center gap-1.5">
              {project.verification_status === "VERIFIED" && (
                <span
                  title="Audited AI Project & Cleared Rights"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
              {isOwner && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium backdrop-blur-md ${
                    project.visibility === "PUBLIC"
                      ? "bg-purple-600/90 text-white"
                      : "bg-amber-500/90 text-white"
                  }`}
                >
                  {project.visibility}
                </span>
              )}
            </div>
          </div>

          {/* Play Icon preview for video items */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:bg-purple-600/90 transition-all duration-300">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Bottom thumbnail tag: Category & AI Generation status */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 z-10 pointer-events-none">
            <span className="font-medium truncate">{project.content_type || project.category}</span>
            <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-purple-300" />
              {project.ai_generation_type === "AI_GENERATED" ? "100% AI Generated" : "AI Assisted"}
            </span>
          </div>
        </CardItem>

        {/* Card Body & Details */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <CardItem translateZ={15} className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1 text-base">
                {project.title}
              </h3>
            </div>
            {project.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </CardItem>

          {/* Tools & Models Badges */}
          <CardItem translateZ={20} className="w-full">
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tools?.slice(0, 3).map((tool, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-100"
                >
                  {tool}
                </span>
              ))}
              {project.tools && project.tools.length > 3 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-500">
                  +{project.tools.length - 3} more
                </span>
              )}
            </div>
          </CardItem>

          {/* Workflow stages indicator */}
          {project.workflow_stages && project.workflow_stages.length > 0 && (
            <CardItem translateZ={10} className="w-full">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {project.workflow_stages.length} workflow stages documented
                </span>
              </div>
            </CardItem>
          )}

          {/* Action Footer */}
          <CardItem translateZ={20} className="w-full pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => onSelect && onSelect(project)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors py-1 px-2 rounded-md hover:bg-purple-50"
            >
              Inspect Workflow
              <ExternalLink className="w-3 h-3" />
            </button>

            {isOwner && (
              <div className="flex items-center gap-1">
                {onToggleVisibility && (
                  <button
                    onClick={() => onToggleVisibility(project)}
                    title={project.visibility === "PUBLIC" ? "Make Private" : "Make Public"}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {project.visibility === "PUBLIC" ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(project)}
                    title="Edit Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(project)}
                    title="Delete Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  )
}

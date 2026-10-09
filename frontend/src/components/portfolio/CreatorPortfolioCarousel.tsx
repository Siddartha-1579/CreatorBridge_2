import React from "react"
import { Carousel, Card, type CardData } from "@/components/ui/apple-cards-carousel"
import type { PortfolioProject } from "@/types"
import {
  Sparkles,
  Layers,
  Wrench,
  Film,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Ratio,
  Maximize2,
} from "lucide-react"

interface CreatorPortfolioCarouselProps {
  projects: PortfolioProject[]
  onSelectProject?: (project: PortfolioProject) => void
}

export const CreatorPortfolioCarousel: React.FC<CreatorPortfolioCarouselProps> = ({
  projects,
  onSelectProject,
}) => {
  // Filter strictly to public projects for public exposure
  const publicProjects = projects.filter((p) => p.visibility === "PUBLIC")

  if (publicProjects.length === 0) {
    return null
  }

  const items = publicProjects.map((project, idx) => {
    const cardData: CardData = {
      category: project.category || project.content_type || "AI Production",
      title: project.title,
      src:
        project.thumbnail_url ||
        project.media_url ||
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
      tag: project.media_type || "PROJECT",
      alt: project.title,
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-300">
            {project.description}
          </p>

          {/* Technical Specifications Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/60 border border-purple-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Deliverable Format</span>
              <strong className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {project.media_type || "Video/Image"}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/60 border border-purple-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Aspect Ratio</span>
              <strong className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {project.aspect_ratio || "16:9 Master"}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/60 border border-purple-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Resolution</span>
              <strong className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {project.resolution || "4K Ultra-HD"}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/60 border border-purple-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Commercial Status</span>
              <strong className="text-xs font-bold text-purple-900 dark:text-purple-300">
                {project.commercial_use_status?.replace(/_/g, " ") || "Commercial Ready"}
              </strong>
            </div>
          </div>

          {/* AI Tools & Models */}
          {project.tools && project.tools.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Tools & Models Used
              </h5>
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 dark:bg-zinc-800 dark:text-purple-300 border border-purple-200 dark:border-zinc-700"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Production Workflow Stages if documented */}
          {project.workflow_stages && project.workflow_stages.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Production Pipeline Breakdown
              </h5>
              <div className="space-y-2">
                {project.workflow_stages.map((stage, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/50 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                      <span>{stage.stage_name}</span>
                      {stage.tools_used && stage.tools_used.length > 0 && (
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                          {stage.tools_used.join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400">{stage.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          {onSelectProject && (
            <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onSelectProject(project)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                View Full Technical Spec
              </button>
            </div>
          )}
        </div>
      ),
    }

    return <Card key={project.id} card={cardData} index={idx} />
  })

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Portfolio Reel</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Selected work. Creative possibilities.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            Browse authentic generative productions, latent camera techniques, and commercial deliverables.
          </p>
        </div>
      </div>

      <Carousel items={items} />
    </section>
  )
}

export default CreatorPortfolioCarousel

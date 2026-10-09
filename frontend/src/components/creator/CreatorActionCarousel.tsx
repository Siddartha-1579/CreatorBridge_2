import React from "react"
import { Link } from "react-router-dom"
import { Carousel, Card, type CardData } from "@/components/ui/apple-cards-carousel"
import type { CreatorProfile, PortfolioProject, ProfileCompletenessResponse } from "@/types"
import {
  FolderKanban,
  Wrench,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  FileCheck,
} from "lucide-react"

interface CreatorActionCarouselProps {
  profile: CreatorProfile | null
  completeness: ProfileCompletenessResponse | null
  projects: PortfolioProject[]
  onAddProject?: () => void
}

export const CreatorActionCarousel: React.FC<CreatorActionCarouselProps> = ({
  profile,
  completeness,
  projects,
  onAddProject,
}) => {
  const publishedCount = projects.filter((p) => p.visibility === "PUBLIC").length
  const toolsCount = profile?.ai_tools?.length || 0
  const completionPct = completeness?.percentage || 0
  const creatorName = profile?.full_name || "Creator"

  const cardsData: CardData[] = [
    {
      category: "Portfolio Showcase",
      title: "Build Your AI Portfolio",
      src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
      tag: `${publishedCount} Published Assets`,
      alt: "Build your AI portfolio",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            Publish high-resolution video reels, master keyframes, and prompt reproducibility logs so enterprise brands can evaluate your aesthetic standards and technical consistency.
          </p>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-zinc-800/60 border border-purple-100 dark:border-zinc-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
              <span>Current Status</span>
              <span>{publishedCount} Public Projects</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {publishedCount === 0
                ? "You have not published any projects yet. Brands require at least 1 showcase asset to invite you to private briefs."
                : `Great start! Top-booked creators feature 3–5 diverse projects covering varied prompts, models, and deliverable ratios.`}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/creator/portfolio"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all"
            >
              Open Portfolio Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {onAddProject && (
              <button
                type="button"
                onClick={onAddProject}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
              >
                + Add Showcase Project
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      category: "Toolchain & Models",
      title: "Showcase Your AI Tools & Workflows",
      src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
      tag: `${toolsCount} Certified Platforms`,
      alt: "Showcase AI tools and workflows",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            Brands search for creators based on specific tool proficiencies like Runway Gen-3, Midjourney v6, ElevenLabs, and custom ComfyUI nodes.
          </p>

          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Toolchain for {creatorName}
            </h5>
            <div className="flex flex-wrap gap-2">
              {profile?.ai_tools && profile.ai_tools.length > 0 ? (
                profile.ai_tools.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No tools selected yet.</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/creator/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all"
            >
              Update AI Tools & Models
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ),
    },
    {
      category: "Work Presentation",
      title: "Highlight Your Strongest Projects",
      src: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
      tag: "Featured Reel",
      alt: "Highlight strongest projects",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            Designate your primary showpiece as a Featured Project. Featured projects are highlighted directly at the top of your public profile and prioritized in client search filters.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700 space-y-2 text-xs">
            <strong className="text-slate-900 dark:text-white block">Recommendation</strong>
            <p className="text-slate-600 dark:text-zinc-400">
              Select a project that demonstrates multi-shot consistency, high visual fidelity, and clean audio or post-processing integration.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/creator/portfolio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all"
            >
              Manage Project Highlights
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ),
    },
    {
      category: "Commercial Governance",
      title: "Define Commercial-Use Capabilities",
      src: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
      tag: "IP Escrow Ready",
      alt: "Define commercial-use capabilities",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            Enterprise brands demand clear IP chain-of-title, commercial model licensing assurances, and deliverable format specs before awarding high-budget campaigns.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-slate-400 block">Commercial Clearance</span>
              <strong className="text-purple-950 font-bold">Commercial Ready</strong>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-slate-400 block">Deliverable Aspect</span>
              <strong className="text-purple-950 font-bold">16:9 & 9:16 HDR</strong>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/creator/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all"
            >
              Configure Formats & Licensing
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ),
    },
    {
      category: "Profile Optimization",
      title: "Complete Your Creator Profile",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
      tag: `${completionPct}% Complete`,
      alt: "Complete creator profile",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            A complete profile gives brands the confidence to reach out directly with custom briefs and invitations.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Overall Completeness</span>
              <span>{completionPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/creator/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all"
            >
              Complete Missing Milestones
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ),
    },
    {
      category: "Campaign Discovery",
      title: "Discover Opportunities For Your Niche",
      src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
      tag: "Live Briefs",
      alt: "Discover campaign opportunities",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            Brands publish creative briefs seeking specialists in {profile?.primary_specialization || "AI Production"}. View incoming project invitations and open opportunities.
          </p>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-zinc-800 border border-purple-100 text-xs space-y-1">
            <strong className="text-purple-900 dark:text-purple-300 block">Specialization Matching</strong>
            <p className="text-slate-600 dark:text-zinc-400">
              Your profile is indexed for brands seeking: {profile?.primary_specialization || "AI Video & Generative Direction"}.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/creator/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all"
            >
              Browse Open Workspaces
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ),
    },
  ]

  const items = cardsData.map((card, idx) => (
    <Card key={card.title} card={card} index={idx} />
  ))

  return (
    <section className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Growth & Opportunities</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Turn your creative skills into opportunities.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            Show brands what you create, which tools you use, and how your workflow turns ideas into deliverables.
          </p>
        </div>
      </div>

      <Carousel items={items} />
    </section>
  )
}

export default CreatorActionCarousel

import React from "react"
import { Carousel, Card, type CardData } from "@/components/ui/apple-cards-carousel"
import { Sparkles, Layers, CheckCircle2, Film, Camera, Zap, Check } from "lucide-react"
import { formatINR } from "@/lib/currency"

export interface BriefTemplate {
  title: string
  category: string
  description: string
  defaultTitle: string
  defaultDescription: string
  defaultBudgetINR: number
  defaultBudgetUSD?: number
  deliverables: { type: string; count: number }[]
  requiredTools: string[]
  aspectRatios: string[]
  visualStyle: string
  image: string
}

const TEMPLATES: BriefTemplate[] = [
  {
    title: "Cinematic Product Launch",
    category: "AI Filmmaking",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80",
    description: "Multi-shot high-production spec film with synchronized lighting, camera sweeps, and neural sound design.",
    defaultTitle: "Cinematic Product Reveal Commercial",
    defaultDescription: "30-second photorealistic product launch video with dramatic dynamic camera angles, cinematic volumetric lighting, and synchronized sound design. Must adhere to brand color palette.",
    defaultBudgetINR: 275000,
    defaultBudgetUSD: 275000,
    deliverables: [{ type: "video", count: 1 }],
    requiredTools: ["Runway Gen-3", "Midjourney", "ElevenLabs"],
    aspectRatios: ["16:9 Master 4K", "9:16 Social Cut"],
    visualStyle: "Photorealistic Cinema / Volumetric Lighting",
  },
  {
    category: "Product Visualization",
    title: "Minimalist Studio Packshots",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    description: "Ultra-sharp 8K e-commerce packshots with customized studio lighting, shadow accuracy, and material fidelity.",
    defaultTitle: "High-End E-Commerce Product Packshots (10 SKUs)",
    defaultDescription: "Suite of high-resolution lifestyle product renders showcasing our new collection across 3 distinct minimalist studio environments with precise reflections and shadow falloff.",
    defaultBudgetINR: 145000,
    defaultBudgetUSD: 145000,
    deliverables: [{ type: "image", count: 10 }],
    requiredTools: ["FLUX.1 Pro", "Magnific AI", "ControlNet"],
    aspectRatios: ["1:1 Square", "4:5 Portrait"],
    visualStyle: "Minimalist Scandinavian Studio / High Key",
  },
  {
    category: "Performance Marketing",
    title: "Short-Form Social Advertisement",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
    description: "Scroll-stopping TikTok and Reels performance ads with rapid hook variations and engaging kinetic typography.",
    defaultTitle: "Iterative Performance Ad Hooks for TikTok & Meta",
    defaultDescription: "5 high-energy 15-second vertical video variations testing distinct emotional angles, product benefit hooks, and native UGC-style voiceovers.",
    defaultBudgetINR: 180000,
    defaultBudgetUSD: 180000,
    deliverables: [{ type: "video", count: 5 }],
    requiredTools: ["CapCut AI", "HeyGen", "Midjourney"],
    aspectRatios: ["9:16 Vertical"],
    visualStyle: "Fast-Paced UGC / Kinetic Typography",
  },
  {
    category: "Brand Worldbuilding",
    title: "Animated Character Storytelling",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    description: "Recurring digital brand ambassador with facial identity lock across narrative scenes and consistent voice acting.",
    defaultTitle: "Digital Brand Spokesperson Origin Story",
    defaultDescription: "Multi-scene animated lore video featuring a persistent brand avatar guiding viewers through our core mission and origin story with emotive line delivery.",
    defaultBudgetINR: 325000,
    defaultBudgetUSD: 325000,
    deliverables: [{ type: "video", count: 1 }, { type: "image", count: 5 }],
    requiredTools: ["HeyGen", "Runway Gen-3", "ElevenLabs"],
    aspectRatios: ["16:9 Cinema", "9:16 Mobile"],
    visualStyle: "Hyper-Real Character / Cinematic Narrative",
  },
  {
    category: "Creative Technology",
    title: "Stylized Generative Visuals",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
    description: "Surreal animated transitions and latent keyframing loops tailored for festival screens and immersive brand spaces.",
    defaultTitle: "Surreal Latent Loop Installation Assets",
    defaultDescription: "Seamless 60fps generative visual loops combining morphing abstract geometries and brand motifs for digital billboards and stage installations.",
    defaultBudgetINR: 240000,
    defaultBudgetUSD: 240000,
    deliverables: [{ type: "video", count: 3 }],
    requiredTools: ["ComfyUI", "AnimateDiff", "Deforum"],
    aspectRatios: ["16:9 Ultra-Wide", "1:1"],
    visualStyle: "Surrealist Latent Morphing / Fluid Audio-Reactive",
  },
  {
    category: "Full Campaign",
    title: "Multi-Format Omnichannel Assets",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    description: "Complete asset bundle encompassing hero 4K commercials, social cutdowns, display keyframes, and localized voiceovers.",
    defaultTitle: "Integrated Q3 Global Product Launch Asset Suite",
    defaultDescription: "Comprehensive campaign package: 1x 30s hero brand film, 3x 15s vertical social ads, 8x high-res display banners, and multi-language voice tracks.",
    defaultBudgetINR: 600000,
    defaultBudgetUSD: 600000,
    deliverables: [{ type: "video", count: 4 }, { type: "image", count: 8 }],
    requiredTools: ["Runway Gen-3", "Midjourney v6", "ElevenLabs", "CapCut AI"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:5"],
    visualStyle: "Unified Commercial Premium Brand Identity",
  },
]

interface BrandBriefInspirationCarouselProps {
  onSelectTemplate?: (template: BriefTemplate) => void
}

export const BrandBriefInspirationCarousel: React.FC<BrandBriefInspirationCarouselProps> = ({
  onSelectTemplate,
}) => {
  const items = TEMPLATES.map((tmpl, idx) => {
    const cardData: CardData = {
      category: tmpl.category,
      title: tmpl.title,
      src: tmpl.image,
      tag: "Brief Template",
      alt: tmpl.title,
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-300">
            {tmpl.description}
          </p>

          <div className="p-3 bg-purple-50/60 dark:bg-zinc-800/60 rounded-xl border border-purple-100 text-xs text-purple-900 dark:text-purple-300">
            <strong>Inspiration Template Notice:</strong> This provides an illustrative starting structure for your brief. You can customize all goals, deliverables, and budgets before publishing.
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Recommended Style</span>
              <strong className="text-slate-900 dark:text-white font-bold">{tmpl.visualStyle}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Est. Starting Budget</span>
              <strong className="text-slate-900 dark:text-white font-bold">{formatINR(tmpl.defaultBudgetINR)}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Suggested Deliverables & Tools
            </h5>
            <div className="flex flex-wrap gap-2">
              {tmpl.aspectRatios.map((ar, aIdx) => (
                <span
                  key={aIdx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                >
                  {ar}
                </span>
              ))}
              {tmpl.requiredTools.map((t, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-zinc-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {onSelectTemplate && (
            <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onSelectTemplate(tmpl)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Use Direction for Brief
              </button>
            </div>
          )}
        </div>
      ),
    }

    return <Card key={tmpl.title} card={cardData} index={idx} />
  })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Creative Directions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Start with a creative direction.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            Select an established AI production workflow template to pre-populate your campaign brief.
          </p>
        </div>
      </div>

      <Carousel items={items} />
    </section>
  )
}

export default BrandBriefInspirationCarousel

import React from "react"
import { Link } from "react-router-dom"
import { Carousel, Card, type CardData } from "@/components/ui/apple-cards-carousel"
import { ArrowRight, Sparkles, Layers, CheckCircle2, Film, Camera, Users, Zap, Wrench } from "lucide-react"

interface SpecializationItem {
  category: string
  title: string
  tag: string
  image: string
  summary: string
  deliverables: string[]
  tools: string[]
  pipeline: string[]
  ctaText: string
  ctaLink: string
}

const SPECIALIZATIONS: SpecializationItem[] = [
  {
    category: "AI Video & Motion",
    title: "Cinematic Commercial Direction & Motion Synthesis",
    tag: "High Demand",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80",
    summary: "Directing multi-shot cinematic video with consistent lighting, dynamic camera tracking, and coherent character identities.",
    deliverables: ["30s Commercial Spec Trailer", "9:16 Social Cutdowns", "4K HDR Master Deliverables"],
    tools: ["Runway Gen-3", "Luma Dream Machine", "Kling AI", "Sora"],
    pipeline: [
      "Midjourney v6 for initial visual keyframing and camera angle scouting",
      "Runway Gen-3 / Kling for motion vector and camera-path synthesis",
      "ComfyUI IP-Adapter for character facial consistency across cuts",
      "ElevenLabs & Topaz Video AI for neural audio syncing and 4K upscaling",
    ],
    ctaText: "Explore Video Directors",
    ctaLink: "/brand/discover",
  },
  {
    category: "Generative Art & Visual Design",
    title: "Hyper-Real Product Staging & Brand Keyframes",
    tag: "Editorial Quality",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
    summary: "Crafting photorealistic product photography, architectural concepts, and ultra-high-resolution billboard assets.",
    deliverables: ["8K Master Visual Assets", "Multi-Angle Lighting Studies", "Billboard-Ready Print Files"],
    tools: ["FLUX.1 Pro", "Midjourney v6.1", "Magnific AI", "SDXL"],
    pipeline: [
      "FLUX.1 Pro prompt conditioning with custom negative constraints",
      "Depth-map and normal-map guidance for geometry accuracy",
      "Magnific Relight for commercial studio lighting passes",
      "Vector separation and CMYK color-proofing for commercial print",
    ],
    ctaText: "Explore Visual Artists",
    ctaLink: "/brand/discover",
  },
  {
    category: "AI Product Photography",
    title: "Virtual Studio Sets & Commercial Packshots",
    tag: "E-Commerce",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80",
    summary: "Transforming 3D CAD models and raw product images into breathtaking lifestyle staging without studio physical shoots.",
    deliverables: ["E-Commerce SKU Catalogs", "Seasonal Environment Sets", "Lifestyle Staging Variations"],
    tools: ["Stable Diffusion", "ControlNet", "ComfyUI", "Photoshop Generative Fill"],
    pipeline: [
      "Extracting product mask and edge boundaries with segment-anything (SAM)",
      "Generating dynamic 3D-consistent backgrounds with ControlNet depth",
      "Matching shadows and contact reflections to real-world physics",
      "Batch catalog rendering across 50+ background environments",
    ],
    ctaText: "Explore Packshot Creators",
    ctaLink: "/brand/discover",
  },
  {
    category: "AI Characters & Storytelling",
    title: "Persistent Digital Humans & Narrative Lore",
    tag: "Brand IP",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80",
    summary: "Creating recurring AI brand ambassadors, virtual spokespersons, and multi-scene narrative universes with licensed likenesses.",
    deliverables: ["Brand Persona Bible", "Multi-Episode Narrative Assets", "Custom Voice Cloning Assets"],
    tools: ["HeyGen", "Midjourney", "ElevenLabs", "Runway Gen-3"],
    pipeline: [
      "Training custom facial identity checkpoints with multi-angle LoRAs",
      "Voice persona synthesis with licensed ElevenLabs voice clones",
      "Lip-sync alignment and emotional cadence modulation",
      "Exporting omnichannel character asset libraries for social & web",
    ],
    ctaText: "Explore Character Creators",
    ctaLink: "/brand/discover",
  },
  {
    category: "AI Advertising & Campaigns",
    title: "High-Converting Performance Hooks & Dynamic Ad Iteration",
    tag: "ROI Focused",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80",
    summary: "Rapidly generating and iterating on performance hooks, localized product spots, and TikTok/Reels short-form creative variants.",
    deliverables: ["10x Iterative Hook Variations", "9:16 Short-Form Ad Cuts", "Multi-Language Localized VO"],
    tools: ["CapCut AI", "HeyGen", "Pika Labs", "Claude 3.5 Sonnet"],
    pipeline: [
      "Claude 3.5 Sonnet generates 20 hook variations based on audience pain points",
      "Batch neural video synthesis with high-energy pacing",
      "Dynamic typography and sound effect synchronization",
      "Automated aspect ratio adaptation for TikTok, Meta, and YouTube Shorts",
    ],
    ctaText: "Explore Performance Ad Creators",
    ctaLink: "/brand/discover",
  },
  {
    category: "AI Automation & Workflows",
    title: "Custom ComfyUI Pipelines & Generative Infrastructure",
    tag: "Enterprise",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
    summary: "Architecting automated creative pipelines, custom LoRA models, and internal asset generation engines for high-volume brand studios.",
    deliverables: ["Custom ComfyUI Workflow JSONs", "Proprietary Brand Style LoRA", "Automated API Render Endpoints"],
    tools: ["ComfyUI", "Kohya-ss", "RunPod", "Python"],
    pipeline: [
      "Dataset curation and captioning with BLIP-2 & WD14",
      "Targeted LoRA checkpoint fine-tuning on company design language",
      "Node-based workflow construction in ComfyUI with error fallback",
      "Cloud deployment via serverless GPU APIs for self-service team generation",
    ],
    ctaText: "Explore Pipeline Engineers",
    ctaLink: "/brand/discover",
  },
]

export const LandingSpecializationCarousel: React.FC = () => {
  const cards: React.ReactNode[] = SPECIALIZATIONS.map((spec, index) => {
    const cardData: CardData = {
      category: spec.category,
      title: spec.title,
      src: spec.image,
      tag: spec.tag,
      alt: spec.title,
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-300">
            {spec.summary}
          </p>

          {/* AI Tools Tag Cloud */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Production Toolchain & AI Models
            </h5>
            <div className="flex flex-wrap gap-2">
              {spec.tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 dark:bg-zinc-800 dark:text-purple-300 border border-purple-200 dark:border-zinc-700"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Example Deliverables */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Standard Brand Deliverables
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {spec.deliverables.map((deliv, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{deliv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Production Workflow Stages */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Authentic Production Workflow
            </h5>
            <div className="space-y-2">
              {spec.pipeline.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-300"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Callout */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F4E7FF]">
            <span className="text-xs text-[#4B4652]">
              Ready to brief an AI specialist in this discipline?
            </span>
            <Link
              to={spec.ctaLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9A6ADF] hover:bg-[#8655cb] shadow-md shadow-[#9A6ADF]/20 transition-colors w-full sm:w-auto justify-center"
            >
              {spec.ctaText}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ),
    }

    return <Card key={spec.category} card={cardData} index={index} />
  })

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#FFFDFD] border-y border-[#F4E7FF]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
            <Sparkles className="w-3.5 h-3.5 text-[#9A6ADF]" />
            <span>Specialization Discovery</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111111] leading-tight">
            Meet the creators shaping what&apos;s next.
          </h2>

          <p className="text-sm sm:text-base text-[#4B4652] leading-relaxed">
            Explore the people, AI workflows, and creative possibilities connecting brands with the next generation of AI-native talent.
          </p>
        </div>
      </div>

      <Carousel items={cards} />
    </section>
  )
}

export default LandingSpecializationCarousel

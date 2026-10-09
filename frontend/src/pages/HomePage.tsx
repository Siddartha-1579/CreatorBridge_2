import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Marketplace3DCard } from "@/components/common/Marketplace3DCard"
import { ScrollReveal } from "@/components/common/ScrollReveal"
import { LandingSpecializationCarousel } from "@/components/home/LandingSpecializationCarousel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Film,
  Camera,
  Layers,
  Wand2,
  Zap,
  Users,
  Briefcase,
  Cpu,
  BarChart3,
  Sliders,
  Check,
  Award,
  Lock,
  ChevronRight,
  Compass,
  FileCode,
  Globe,
  RefreshCw,
  ExternalLink,
} from "lucide-react"

export const HomePage: React.FC = () => {
  const [activeRoleTab, setActiveRoleTab] = useState<number>(0)
  const [howItWorksTab, setHowItWorksTab] = useState<"creator" | "brand">("creator")

  const creatorCategories = [
    {
      title: "AI Filmmakers",
      subtitle: "Cinematic Narrative & Camera Direction",
      tools: ["Runway Gen-3", "Luma Dream Machine", "Kling", "Sora"],
      desc: "Direct multi-shot cinematic video with consistent lighting, dynamic tracking shots, and character continuity.",
      sampleDeliverable: "30s Commercial Spec Trailer",
      bgGrad: "from-purple-500/10 to-indigo-500/10",
    },
    {
      title: "AI Animators",
      subtitle: "Latent Keyframing & Stylized Motion",
      tools: ["ComfyUI", "AnimatedDiff", "Deforum", "Stable Diffusion"],
      desc: "Produce fluid frame-to-frame animation, generative anime, and surreal fluid visual transitions.",
      sampleDeliverable: "15s Animated Brand Reel",
      bgGrad: "from-indigo-500/10 to-blue-500/10",
    },
    {
      title: "AI Image Creators",
      subtitle: "Hyper-Real Product & World Staging",
      tools: ["Midjourney v6", "FLUX.1 Pro", "SDXL", "Magnific AI"],
      desc: "Craft photorealistic product photography, architectural concepts, and ultra-high-resolution billboard assets.",
      sampleDeliverable: "8k Master Visual Assets",
      bgGrad: "from-purple-500/10 to-pink-500/10",
    },
    {
      title: "AI Motion Designers",
      subtitle: "Audio-Reactive & Kinetic Visuals",
      tools: ["Kaiber", "ControlNet", "After Effects", "TouchDesigner"],
      desc: "Transform kinetic typography, audio rhythms, and brand vectors into dynamic generative motion assets.",
      sampleDeliverable: "Multi-Format Social Hooks (9:16)",
      bgGrad: "from-blue-500/10 to-purple-500/10",
    },
    {
      title: "Generative Storytellers",
      subtitle: "Multi-Scene Lore & Conceptual IP",
      tools: ["Claude 3.5 Sonnet", "ElevenLabs", "Midjourney", "Runway"],
      desc: "Orchestrate complete narrative storyboards, synthetic character voiceovers, and worldbuilding lore for brand campaigns.",
      sampleDeliverable: "Full Campaign Storyboard & VO",
      bgGrad: "from-pink-500/10 to-purple-500/10",
    },
    {
      title: "AI Ad Creators",
      subtitle: "High-Converting Performance Hooks",
      tools: ["HeyGen", "Pika Labs", "Midjourney", "CapCut AI"],
      desc: "Rapidly test multi-variant ad hooks, seasonal product drops, and localized video ad variations for TikTok and Meta.",
      sampleDeliverable: "10x Iterative Ad Variations",
      bgGrad: "from-purple-500/10 to-emerald-500/10",
    },
  ]

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const headerOffset = 80
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }

  return (
    <div className="relative overflow-hidden bg-[#FFFDFD] text-[#111111]">
      {/* Soft Brand Ambient Glow Accents (Off-White, Pale Lavender, Subtle Peach) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#F4E7FF]/70 via-[#FFF4E5]/40 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[1200px] right-0 w-[500px] h-[500px] bg-gradient-to-l from-[#F4E7FF]/50 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ============================================================ */}
      {/* SECTION 01 — HERO */}
      {/* ============================================================ */}
      <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
          {/* Subtle Tagline Pill */}
          <ScrollReveal direction="down">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D8B8FF] bg-[#F4E7FF]/70 text-[#9A6ADF] text-xs font-semibold shadow-xs mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[#9A6ADF]" />
              <span>Where Brands Meet Creativity</span>
              <span className="text-[#D8B8FF]">•</span>
              <span className="text-[#111111] font-bold">Intelligent Creator Marketplace</span>
            </div>
          </ScrollReveal>

          {/* Main Headline */}
          <ScrollReveal direction="up" delayMs={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111111] leading-[1.12] mb-6">
              The Right Creators. The Right Campaigns.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A6ADF] via-[#8553cb] to-[#b46b14]">
                One Intelligent Bridge.
              </span>
            </h1>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal direction="up" delayMs={200}>
            <p className="text-base sm:text-lg text-[#4B4652] leading-relaxed max-w-2xl mx-auto mb-9">
              CreatorBridge connects brands with the right creative talent through intelligent matching, streamlined campaign management, and AI-powered content creation tools.
            </p>
          </ScrollReveal>

          {/* Prominent Dual CTAs */}
          <ScrollReveal direction="up" delayMs={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link to="/register?role=BRAND" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-semibold gap-2 px-8 py-3.5 bg-[#9A6ADF] hover:bg-[#8655cb] text-white shadow-md shadow-[#9A6ADF]/25 rounded-xl cursor-pointer"
                >
                  I'm a Brand <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/register?role=CREATOR" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-semibold bg-white hover:bg-[#F4E7FF]/50 border-[#D8B8FF] text-[#111111] px-8 py-3.5 rounded-xl shadow-xs cursor-pointer"
                >
                  I'm a Creator
                </Button>
              </Link>
            </div>

            <button
              onClick={() => scrollToSection("problem")}
              className="text-xs text-[#4B4652] hover:text-[#9A6ADF] font-medium py-2 px-3 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              Why CreatorBridge? ↓
            </button>
          </ScrollReveal>

          {/* Trust & Guarantee Markers Row */}
          <ScrollReveal direction="up" delayMs={350}>
            <div className="pt-6 border-t border-[#F4E7FF] flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-[#4B4652] mb-12">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-[#9A6ADF]" />
                <span>98.4% Match Accuracy</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-[#9A6ADF]" />
                <span>Commercial IP Escrow Protection</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-4 w-4 text-[#9A6ADF]" />
                <span>1,200+ Verified AI Creators</span>
              </div>
            </div>
          </ScrollReveal>

          {/* ============================================================ */}
          {/* HERO PLATFORM PREVIEW DASHBOARD (Every AI inspired layout) */}
          {/* ============================================================ */}
          <ScrollReveal direction="up" delayMs={400}>
            <div className="relative mx-auto max-w-5xl rounded-2xl sm:rounded-3xl border border-[#D8B8FF]/70 bg-white p-3 sm:p-5 shadow-2xl shadow-[#9A6ADF]/10 text-left">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F4E7FF] text-xs text-[#4B4652]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#FFD7A8]" />
                  <span className="h-3 w-3 rounded-full bg-[#D8B8FF]" />
                  <span className="h-3 w-3 rounded-full bg-[#F4E7FF]" />
                  <span className="font-semibold text-[#111111] ml-2 hidden sm:inline">
                    CreatorBridge Platform • Intelligent Command Center
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4E7FF] text-[#9A6ADF] text-[11px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9A6ADF] animate-pulse" />
                  Live Match Engine v2.4
                </div>
              </div>

              {/* Simulated Search & Filter Strip */}
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFDFD] p-2.5 rounded-xl border border-[#F4E7FF]">
                <div className="flex items-center gap-2 text-xs text-[#4B4652] w-full sm:w-auto">
                  <Sparkles className="h-3.5 w-3.5 text-[#9A6ADF]" />
                  <span className="truncate">Active Brief: <strong>Aura Spatial Sound — Global Motion Launch</strong></span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4E7FF] text-[#9A6ADF]">
                    Runway Gen-3
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4E7FF] text-[#9A6ADF]">
                    ComfyUI
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FFF4E5] text-[#b46b14]">
                    48h Turnaround
                  </span>
                </div>
              </div>

              {/* 2-Column Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Card: Intelligent Brief & Match Affinity Radar */}
                <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-[#FFFDFD] border border-[#F4E7FF] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6ADF]">
                        Explainable AI Matching
                      </span>
                      <h4 className="font-bold text-sm text-[#111111]">
                        Brief Alignment Analysis
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#9A6ADF] font-mono">
                        98.4%
                      </span>
                      <span className="block text-[10px] text-[#4B4652]">Match Score</span>
                    </div>
                  </div>

                  {/* Visual Match Meter */}
                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-[#F4E7FF] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#9A6ADF] to-[#FFD7A8] rounded-full w-[98.4%]" />
                    </div>
                    <p className="text-[11px] text-[#4B4652] leading-relaxed">
                      Matches verified camera trajectory depth, audio-reactive fluid physics, and multi-cut 9:16 vertical delivery.
                    </p>
                  </div>

                  {/* Requirements List */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F4E7FF] text-xs">
                    <div className="p-2 rounded-lg bg-white border border-[#F4E7FF]">
                      <span className="text-[10px] text-[#4B4652] block">Escrow Funding</span>
                      <span className="font-bold text-[#111111]">$3,200 USD Locked</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#F4E7FF]">
                      <span className="text-[10px] text-[#4B4652] block">Commercial IP</span>
                      <span className="font-bold text-[#111111]">100% Buyout Handover</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Matched Creator Spotlight */}
                <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#D8B8FF] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#9A6ADF] to-[#D8B8FF] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                        ER
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-[#111111]">Elena Rostova</h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFF4E5] text-[#b46b14]">
                            ★ 4.98
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4B4652]">Master AI Video Director • 24 Campaigns</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                      Top Ranked
                    </span>
                  </div>

                  <p className="text-xs text-[#4B4652] leading-relaxed">
                    Directing cinematic commercial trailers and photorealistic product staging with Runway Gen-3 camera control and ComfyUI pipelines.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Runway Gen-3", "FLUX.1 Pro", "ComfyUI", "ElevenLabs"].map((tool) => (
                      <span key={tool} className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4E7FF] text-[#9A6ADF] font-medium border border-[#D8B8FF]/50">
                        {tool}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#F4E7FF] flex items-center justify-between">
                    <span className="text-[11px] text-[#4B4652]">
                      Status: <strong className="text-[#111111]">Ready to Bridge</strong>
                    </span>
                    <Link
                      to="/brand/briefs/new"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#9A6ADF] hover:text-[#8655cb]"
                    >
                      Bridge Campaign Brief <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 01B — APPLE CARDS CAROUSEL SPECIALIZATION SHOWCASE */}
      {/* ============================================================ */}
      <LandingSpecializationCarousel />

      {/* ============================================================ */}
      {/* SECTION 02 — THE PROBLEM */}
      {/* ============================================================ */}
      <section id="problem" className="py-20 md:py-28 bg-[#FFFDFD] border-y border-[#F4E7FF]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <ScrollReveal direction="down">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                The Industry Shift
              </span>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={100}>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                Traditional Freelance Platforms Fail Generative AI.
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                Generative AI created a revolutionary creative discipline with its own workflows, checkpoints, latent math, and iteration requirements. Yet legacy freelance sites still treat creators like generic graphic designers.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal direction="up" delayMs={100}>
              <Card className="h-full border-[#F4E7FF] bg-white hover:border-[#D8B8FF] transition-all shadow-xs">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold mb-3">
                    01
                  </div>
                  <CardTitle className="text-base text-[#111111]">
                    Tool & Model Invisibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-[#4B4652] leading-relaxed space-y-2">
                  <p className="line-through text-zinc-400">
                    Legacy: Asking for "Photoshop & Premiere skills."
                  </p>
                  <p className="text-[#9A6ADF] font-medium">
                    The Reality: AI directors require mastery of ControlNet, IP-Adapters, motion latent seeds, and multi-model stitching.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <Card className="h-full border-[#F4E7FF] bg-white hover:border-[#D8B8FF] transition-all shadow-xs">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold mb-3">
                    02
                  </div>
                  <CardTitle className="text-base text-[#111111]">
                    Static JPEG Portfolios
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-[#4B4652] leading-relaxed space-y-2">
                  <p className="line-through text-zinc-400">
                    Legacy: Reviewing flat static images without context.
                  </p>
                  <p className="text-[#9A6ADF] font-medium">
                    The Reality: Brands need prompt transparency, seed reproducibility logs, native 4K upscaling evidence, and video continuity reels.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={300}>
              <Card className="h-full border-[#F4E7FF] bg-white hover:border-[#D8B8FF] transition-all shadow-xs">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold mb-3">
                    03
                  </div>
                  <CardTitle className="text-base text-[#111111]">
                    Unverifiable Prompt Claims
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-[#4B4652] leading-relaxed space-y-2">
                  <p className="line-through text-zinc-400">
                    Legacy: Anyone with a lucky one-off render claims expert status.
                  </p>
                  <p className="text-[#9A6ADF] font-medium">
                    The Reality: Commercial production requires benchmark testing for multi-angle consistency, mood consistency, and character identity locks.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={400}>
              <Card className="h-full border-[#F4E7FF] bg-white hover:border-[#D8B8FF] transition-all shadow-xs">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold mb-3">
                    04
                  </div>
                  <CardTitle className="text-base text-[#111111]">
                    Broken Billing Models
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-[#4B4652] leading-relaxed space-y-2">
                  <p className="line-through text-zinc-400">
                    Legacy: Hourly time-tracking that penalizes rapid AI execution.
                  </p>
                  <p className="text-[#9A6ADF] font-medium">
                    The Reality: Deliverable-based milestone escrow factoring in GPU compute costs, model iterations, and commercial licensing rights.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 03 — THE NEW AI CREATOR ECONOMY */}
      {/* ============================================================ */}
      <section id="economy" className="py-20 md:py-28 bg-[#FFFDFD]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <ScrollReveal direction="down">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                New Creative Class
              </span>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={100}>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                The Emerging Roles of the AI Creative Economy
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                Generative AI is not eliminating human creativity—it is minting specialized creative directors who speak in diffusion models, camera trajectories, and latent space.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorCategories.map((cat, idx) => (
              <ScrollReveal key={cat.title} direction="up" delayMs={idx * 80}>
                <div className="group relative rounded-2xl border border-[#F4E7FF] bg-white p-6 shadow-xs hover:shadow-xl hover:shadow-[#9A6ADF]/10 hover:border-[#D8B8FF] transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A6ADF]">
                        Specialization 0{idx + 1}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-[#9A6ADF] animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#111111] group-hover:text-[#9A6ADF] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs font-medium text-[#4B4652] mt-0.5">
                        {cat.subtitle}
                      </p>
                    </div>

                    <p className="text-xs text-[#4B4652] leading-relaxed">
                      {cat.desc}
                    </p>

                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Mastered Toolchain:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cat.tools.map((tool) => (
                          <span
                            key={tool}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]/60 font-medium"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F4E7FF] flex items-center justify-between text-xs">
                    <span className="text-[#4B4652] text-[11px]">
                      Spec: <strong className="text-[#111111] font-semibold">{cat.sampleDeliverable}</strong>
                    </span>
                    <Link
                      to="/brand/discover"
                      className="text-[#9A6ADF] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Find Talent <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04 — FOR CREATORS */}
      {/* ============================================================ */}
      <section id="for-creators" className="py-20 md:py-28 bg-gradient-to-b from-[#F4E7FF]/40 via-[#FFFDFD] to-[#FFFDFD] border-t border-[#F4E7FF]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Creator Value Proposition */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal direction="down">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                  For AI Creators
                </span>
              </ScrollReveal>

              <ScrollReveal direction="up" delayMs={100}>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] leading-tight">
                  Build Your AI Creative Identity. Get Paid What Generative Art Is Actually Worth.
                </h2>
              </ScrollReveal>

              <ScrollReveal direction="up" delayMs={200}>
                <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                  Stop answering briefs asking for "100 AI images for \$5." CreatorBridge connects you with premium brands that understand the difference between amateur prompting and professional generative direction.
                </p>
              </ScrollReveal>

              {/* 5 Creator Pillars */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    title: "BUILD",
                    detail: "Establish an AI-native profile declaring your verified model knowledge, ComfyUI pipelines, and certified toolsets.",
                  },
                  {
                    title: "SHOW",
                    detail: "Showcase dynamic video reels and audio compositions backed by persistent cloud storage and prompt metadata.",
                  },
                  {
                    title: "PROVE",
                    detail: "Pass automated consistency assessments to earn verified creator level badges without giving away secret prompts.",
                  },
                  {
                    title: "DISCOVER",
                    detail: "Receive explainable matches from forward-thinking brands commissioning high-value commercial campaigns.",
                  },
                  {
                    title: "GROW",
                    detail: "Accumulate verified reviews, elevate your marketplace tier, and secure ongoing studio retainer partnerships.",
                  },
                ].map((pillar, idx) => (
                  <ScrollReveal key={pillar.title} direction="left" delayMs={idx * 60}>
                    <div className="p-3.5 rounded-xl border border-[#F4E7FF] bg-white shadow-xs flex items-start gap-3.5">
                      <div className="h-6 w-6 rounded-md bg-[#9A6ADF] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#111111]">
                          {pillar.title}
                        </h4>
                        <p className="text-xs text-[#4B4652] mt-0.5 leading-relaxed">
                          {pillar.detail}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <ScrollReveal direction="up" delayMs={350}>
                <div className="pt-2">
                  <Link to="/register?role=CREATOR">
                    <Button variant="primary" size="lg" className="text-xs font-semibold shadow-md shadow-[#9A6ADF]/20 gap-2 px-6">
                      Apply as an AI Creator <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Visual 3D Showcase Card */}
            <div className="lg:col-span-6 flex justify-center">
              <ScrollReveal direction="right" delayMs={200} className="w-full max-w-md">
                <Marketplace3DCard
                  variant="portfolio"
                  category="Creator Reel Showcase"
                  badge="Verified 4K Upscale"
                  title="Neon Odyssey: Hypercar Reveal"
                  description="A speculative 45s launch commercial created using Runway Gen-3 camera control, FLUX.1 textures, and ElevenLabs synthetic sound design."
                  image="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop"
                  tags={["Runway Gen-3", "FLUX.1 Pro", "ElevenLabs", "After Effects"]}
                  metadata={{
                    "Resolution": "3840 x 2160 (4K)",
                    "Aspect Ratio": "16:9 & 9:16 Cuts",
                    "Iteration Count": "18 Seed Passes",
                    "Commercial License": "Full Rights Transferred",
                  }}
                  action={{
                    label: "Inspect Generation Log",
                    href: "/creator/portfolio",
                  }}
                />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 05 — FOR BRANDS */}
      {/* ============================================================ */}
      <section id="for-brands" className="py-20 md:py-28 border-t border-[#F4E7FF] bg-[#FFFDFD]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Visual 3D Campaign Brief Card */}
            <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
              <ScrollReveal direction="left" delayMs={200} className="w-full max-w-md">
                <Marketplace3DCard
                  variant="brief"
                  category="Sample Brand Brief"
                  badge="Funded Escrow"
                  title="Aura Spatial Sound Launch"
                  description="Seeking an AI motion director to produce 3 high-impact 9:16 vertical video hooks showing liquid metallic soundwaves for next-gen wireless headphones."
                  image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
                  tags={["Runway Gen-3", "Midjourney v6", "Commercial Use"]}
                  metadata={{
                    "Budget Allocated": "$3,200 USD",
                    "Required Format": "Vertical Video (9:16)",
                    "Target Timeline": "5 Business Days",
                    "IP Handover": "Commercial Buyout Included",
                  }}
                  action={{
                    label: "Explore Matching Creators",
                    href: "/brand/briefs",
                  }}
                />
              </ScrollReveal>
            </div>

            {/* Right Column: Brand Value Proposition */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              <ScrollReveal direction="down">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                  For Brands & Agencies
                </span>
              </ScrollReveal>

              <ScrollReveal direction="up" delayMs={100}>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] leading-tight">
                  Commission Commercial Generative Campaigns With Total Confidence.
                </h2>
              </ScrollReveal>

              <ScrollReveal direction="up" delayMs={200}>
                <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                  Traditional creative agencies take 8 weeks and six-figure budgets. Amateur AI freelancers deliver inconsistent faces and stolen prompts. CreatorBridge provides the verified middle tier: elite generative artists working under rigorous commercial briefs.
                </p>
              </ScrollReveal>

              {/* 5 Brand Pillars */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    title: "DISCOVER",
                    detail: "Search by specific AI toolchain, visual style, turnaround speed, and verified capability tier.",
                  },
                  {
                    title: "DEFINE",
                    detail: "Publish structured briefs specifying target aspect ratios, brand moodboards, and model constraints.",
                  },
                  {
                    title: "FILTER & MATCH",
                    detail: "Review explainable match scores calculated from tool overlap, style alignment, and past client feedback.",
                  },
                  {
                    title: "EVALUATE",
                    detail: "Inspect authentic generation logs, video reels, and high-resolution outputs before committing funds.",
                  },
                  {
                    title: "ENGAGE",
                    detail: "Collaborate in private project workspaces with milestone payments protected by commercial escrow.",
                  },
                ].map((pillar, idx) => (
                  <ScrollReveal key={pillar.title} direction="right" delayMs={idx * 60}>
                    <div className="p-3.5 rounded-xl border border-[#F4E7FF] bg-white shadow-xs flex items-start gap-3.5">
                      <div className="h-6 w-6 rounded-md bg-[#9A6ADF] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#111111]">
                          {pillar.title}
                        </h4>
                        <p className="text-xs text-[#4B4652] mt-0.5 leading-relaxed">
                          {pillar.detail}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <ScrollReveal direction="up" delayMs={350}>
                <div className="pt-2">
                  <Link to="/register?role=BRAND">
                    <Button variant="primary" size="lg" className="text-xs font-semibold shadow-md shadow-[#9A6ADF]/20 gap-2 px-6">
                      Post a Campaign Brief <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 06 — HOW IT WORKS */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#FFFDFD] border-t border-[#F4E7FF]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <ScrollReveal direction="down">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                End-to-End Workflow
              </span>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={100}>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                How CreatorBridge Works
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                A synchronized platform built to eliminate friction for both creative artists and marketing brands.
              </p>
            </ScrollReveal>

            {/* Path Toggle */}
            <ScrollReveal direction="up" delayMs={250}>
              <div className="inline-flex p-1 rounded-xl bg-[#F4E7FF]/60 border border-[#D8B8FF]">
                <button
                  onClick={() => setHowItWorksTab("creator")}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    howItWorksTab === "creator"
                      ? "bg-white text-[#9A6ADF] shadow-xs"
                      : "text-[#4B4652] hover:text-[#111111]"
                  }`}
                >
                  Creator Path
                </button>
                <button
                  onClick={() => setHowItWorksTab("brand")}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    howItWorksTab === "brand"
                      ? "bg-white text-[#9A6ADF] shadow-xs"
                      : "text-[#4B4652] hover:text-[#111111]"
                  }`}
                >
                  Brand & Agency Path
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Workflow Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {(howItWorksTab === "creator"
              ? [
                  {
                    step: "01",
                    title: "Setup AI Profile",
                    desc: "Declare certified tools (Runway, Midjourney, ComfyUI, FLUX) and visual specializations.",
                  },
                  {
                    step: "02",
                    title: "Upload Portfolio",
                    desc: "Publish high-res video reels, prompt logs, and seed outputs to cloud storage.",
                  },
                  {
                    step: "03",
                    title: "Earn Verification",
                    desc: "Complete benchmark prompt evaluations to unlock higher creator levels.",
                  },
                  {
                    step: "04",
                    title: "Receive Briefs",
                    desc: "Get automatically matched with brand campaigns through explainable AI affinity scores.",
                  },
                  {
                    step: "05",
                    title: "Deliver & Get Paid",
                    desc: "Submit master assets and receive guaranteed escrow payouts upon brand sign-off.",
                  },
                ]
              : [
                  {
                    step: "01",
                    title: "Create Brief",
                    desc: "Publish campaign goals, target aspect ratios (9:16/16:9), tool requirements, and budget.",
                  },
                  {
                    step: "02",
                    title: "Algorithmic Match",
                    desc: "Review ranked creators scored on toolchain alignment, style match, and verified history.",
                  },
                  {
                    step: "03",
                    title: "Inspect Evidence",
                    desc: "Review real prompt logs, model parameters, and high-res video outputs with full clarity.",
                  },
                  {
                    step: "04",
                    title: "Launch Workspace",
                    desc: "Fund project milestones into escrow and collaborate in a private review room.",
                  },
                  {
                    step: "05",
                    title: "Own Deliverables",
                    desc: "Approve final multi-format assets with full commercial copyright and raw pack handover.",
                  },
                ]
            ).map((item, idx) => (
              <ScrollReveal key={item.step} direction="up" delayMs={idx * 70}>
                <div className="relative h-full p-5 rounded-xl border border-[#F4E7FF] bg-white shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#9A6ADF] block mb-2 font-mono">
                      {item.step}
                    </span>
                    <h4 className="font-bold text-sm text-[#111111]">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#4B4652] mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F4E7FF] text-[10px] text-zinc-400 font-semibold uppercase">
                    Stage {idx + 1}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 07 — AI-NATIVE WORKFLOW */}
      {/* ============================================================ */}
      <section id="workflow" className="py-20 md:py-28 border-t border-[#F4E7FF] bg-[#FFFDFD]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <ScrollReveal direction="down">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                Deep Technical Foundation
              </span>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={100}>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                Not a Generic Marketplace With an "AI" Sticker.
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                CreatorBridge understands the technical nuances of generative production. Every contract, brief, and portfolio record is architected around AI parameters.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sliders,
                title: "Toolchain Depth",
                desc: "Filter and match on specific checkpoints, LoRAs, ControlNet preprocessors, and multi-model pipelines.",
              },
              {
                icon: FileCode,
                title: "Prompt Provenance",
                desc: "Optionally preserve generation seeds, positive/negative modifiers, and sampler steps for brand auditing.",
              },
              {
                icon: ShieldCheck,
                title: "Commercial IP Safety",
                desc: "Guarantee clear copyright ownership, model license verification, and safe commercial deployment.",
              },
              {
                icon: RefreshCw,
                title: "Multi-Cut Delivery",
                desc: "Automate packaging of vertical 9:16 cuts, 16:9 cinematic masters, and raw high-res asset bundles.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <ScrollReveal key={feature.title} direction="up" delayMs={idx * 80}>
                  <div className="p-6 rounded-2xl border border-[#F4E7FF] bg-white shadow-xs hover:border-[#D8B8FF] transition-all">
                    <div className="h-10 w-10 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#111111]">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-[#4B4652] mt-2 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 08 — TRUST + VERIFICATION STANDARDS & STATS */}
      {/* ============================================================ */}
      <section id="trust" className="py-20 md:py-28 bg-gradient-to-b from-[#F4E7FF]/30 via-[#FFFDFD] to-[#FFFDFD] border-t border-[#F4E7FF]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <ScrollReveal direction="down">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
                The Trust Layer
              </span>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={100}>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                The Verified AI Creator Standard
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <p className="text-[#4B4652] text-sm sm:text-base leading-relaxed">
                Anyone can generate a single lucky image. Commercial agencies need proof that a creator can execute iterative direction under strict constraints.
              </p>
            </ScrollReveal>
          </div>

          {/* 3 Trust Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <ScrollReveal direction="up" delayMs={100}>
              <div className="p-7 rounded-2xl border border-[#F4E7FF] bg-white shadow-xs space-y-4 hover:border-[#D8B8FF] transition-colors">
                <div className="h-12 w-12 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">
                  1. Capability Benchmark
                </h3>
                <p className="text-xs text-[#4B4652] leading-relaxed">
                  Creators demonstrate multi-frame camera continuity, lighting matching, and character facial consistency across iterative prompts.
                </p>
                <div className="text-[11px] text-[#9A6ADF] font-semibold pt-2 border-t border-[#F4E7FF]">
                  Standardized Assessment Criteria
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={200}>
              <div className="p-7 rounded-2xl border border-[#F4E7FF] bg-white shadow-xs space-y-4 hover:border-[#D8B8FF] transition-colors">
                <div className="h-12 w-12 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">
                  2. Workflow Authenticity
                </h3>
                <p className="text-xs text-[#4B4652] leading-relaxed">
                  Verification ensures creators actually control their underlying generation pipeline rather than passing off public preset downloads.
                </p>
                <div className="text-[11px] text-[#9A6ADF] font-semibold pt-2 border-t border-[#F4E7FF]">
                  Original Creative Authorship
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={300}>
              <div className="p-7 rounded-2xl border border-[#F4E7FF] bg-white shadow-xs space-y-4 hover:border-[#D8B8FF] transition-colors">
                <div className="h-12 w-12 rounded-xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">
                  3. Commercial Reliability
                </h3>
                <p className="text-xs text-[#4B4652] leading-relaxed">
                  Transparent reputation tracking measuring on-time milestone delivery, revision turnaround times, and professional communication.
                </p>
                <div className="text-[11px] text-[#9A6ADF] font-semibold pt-2 border-t border-[#F4E7FF]">
                  Guaranteed Commercial Standards
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Key Trust & Performance Metrics Banner */}
          <ScrollReveal direction="up" delayMs={350}>
            <div className="max-w-5xl mx-auto rounded-2xl border border-[#D8B8FF] bg-white p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#9A6ADF] font-mono">
                    98.4%
                  </div>
                  <div className="text-xs font-bold text-[#111111]">Match Accuracy</div>
                  <p className="text-[11px] text-[#4B4652]">Explainable AI affinity scoring</p>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#111111] font-mono">
                    1,200+
                  </div>
                  <div className="text-xs font-bold text-[#111111]">Verified Creators</div>
                  <p className="text-[11px] text-[#4B4652]">Certified multi-model workflows</p>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#9A6ADF] font-mono">
                    48h
                  </div>
                  <div className="text-xs font-bold text-[#111111]">Average Turnaround</div>
                  <p className="text-[11px] text-[#4B4652]">Accelerated generative speed</p>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#b46b14] font-mono">
                    100%
                  </div>
                  <div className="text-xs font-bold text-[#111111]">Commercial IP Safety</div>
                  <p className="text-[11px] text-[#4B4652]">Protected escrow & rights buyout</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Verification Engine Active Notice */}
          <div className="mt-10 text-center">
            <span className="inline-flex items-center gap-2 text-xs text-[#4B4652] bg-white px-4 py-2 rounded-full border border-[#F4E7FF]">
              <span className="h-2 w-2 rounded-full bg-[#9A6ADF]" />
              Platform Verification Engine Active • Phase 2 Verified Commercial Standards Enforced
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 09 — FINAL CALL TO ACTION */}
      {/* ============================================================ */}
      <section id="get-started" className="py-20 md:py-28 border-t border-[#F4E7FF] bg-[#FFFDFD]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-[#9A6ADF] via-[#8553cb] to-[#6a3da8] p-8 sm:p-12 md:p-16 text-white text-center shadow-xl shadow-[#9A6ADF]/20 space-y-8 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#FFD7A8]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#F4E7FF]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                Launch Your AI Creative Future
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Step Into the Future of AI-Native Creative Work.
              </h2>
              <p className="text-sm sm:text-base text-purple-100 max-w-xl mx-auto leading-relaxed">
                Whether you're a generative artist expanding creative frontiers or a brand building what's next, CreatorBridge is your commercial home.
              </p>
            </div>

            {/* Dual Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto relative z-10 pt-2">
              <Link to="/register?role=BRAND">
                <Button
                  size="lg"
                  className="w-full bg-white hover:bg-[#F4E7FF] text-[#9A6ADF] font-bold text-xs shadow-lg shadow-black/10 py-6 rounded-xl cursor-pointer"
                >
                  I'm a Brand — Post Brief <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>

              <Link to="/register?role=CREATOR">
                <Button
                  size="lg"
                  className="w-full bg-[#5b3096] hover:bg-[#4d2780] text-white border border-[#D8B8FF]/40 font-bold text-xs py-6 rounded-xl cursor-pointer"
                >
                  I'm a Creator — Join Roster <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-purple-200/90 relative z-10">
              Free to register • Verified marketplace escrow • Commercial copyright guaranteed
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

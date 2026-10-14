import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { generationService } from "@/services/generation.service"
import type { GenerationJob, AssetType, AIStatusData } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Video,
  Mic,
  PenTool,
  Share2,
  FolderPlus,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
  Sliders,
  ExternalLink,
} from "lucide-react"

type StudioMode = "image" | "video" | "voice" | "writing" | "repurpose" | "portfolio"

interface StudioModuleDef {
  id: StudioMode
  name: string
  modality: AssetType
  tagline: string
  icon: React.ElementType
  defaultPrompt: string
  placeholder: string
  aspectRatios?: string[]
}

const STUDIOS: StudioModuleDef[] = [
  {
    id: "image",
    name: "AI Image Studio",
    modality: "IMAGE",
    tagline: "Generate concept art, visual keyframes, and aesthetic moodboards across aspect ratios.",
    icon: ImageIcon,
    defaultPrompt: "Cinematic portrait of a futuristic cyberpunk artisan assembling neon holographic jewelry, 8k, volumetric soft lighting, Cooke anamorphic lens.",
    placeholder: "Describe your visual concept, atmosphere, lighting, camera angle, and aesthetic style...",
    aspectRatios: ["1:1", "16:9", "9:16"],
  },
  {
    id: "video",
    name: "AI Video Studio",
    modality: "VIDEO",
    tagline: "Synthesize dynamic motion, camera pan trajectories, and high-fidelity video commercials.",
    icon: Video,
    defaultPrompt: "Hyperlapse orbit around an electrified chrome electric vehicle accelerating through rain-slicked Tokyo streets at midnight.",
    placeholder: "Describe the motion dynamics, camera movement (pan, tilt, zoom), subject action, and cinematic pacing...",
    aspectRatios: ["16:9", "9:16"],
  },
  {
    id: "voice",
    name: "AI Voiceover Studio",
    modality: "AUDIO",
    tagline: "High-clarity commercial narration, multilingual accents, and emotional voice acting.",
    icon: Mic,
    defaultPrompt: "Welcome to the future of brand storytelling. Where human imagination meets generative AI velocity.",
    placeholder: "Enter the voiceover script for speech synthesis...",
  },
  {
    id: "writing",
    name: "AI Writing Assistant",
    modality: "TEXT",
    tagline: "Synthesize winning creative pitches, concept treatments, and client campaign proposals.",
    icon: PenTool,
    defaultPrompt: "Pitch a 3-part mixed-media generative campaign for a sustainable luxury streetwear brand targeting Gen-Z collectors.",
    placeholder: "Enter campaign theme, brand goals, or proposal angle...",
  },
  {
    id: "repurpose",
    name: "Cross-Platform Repurposer",
    modality: "TEXT",
    tagline: "Convert a single asset description into TikTok scripts, IG captions, and LinkedIn showcases.",
    icon: Share2,
    defaultPrompt: "Generate 3 high-converting hook variants and platform captions for an AI video commercial showcase.",
    placeholder: "Paste asset description, campaign message, or video script...",
  },
  {
    id: "portfolio",
    name: "AI Portfolio Curation",
    modality: "TEXT",
    tagline: "Structure technical case studies, tool documentation, and workflow breakdown stories.",
    icon: FolderPlus,
    defaultPrompt: "Structure a technical breakdown explaining the Midjourney v6 + Runway Gen-3 pipeline used to produce this campaign.",
    placeholder: "Describe the generation pipeline, prompts, and editing workflow...",
  },
]

export const CreatorStudioPage: React.FC = () => {
  const [activeStudio, setActiveStudio] = useState<StudioMode>("image")
  const [prompt, setPrompt] = useState<string>(STUDIOS[0].defaultPrompt)
  const [aspectRatio, setAspectRatio] = useState<string>("16:9")
  const [durationSeconds, setDurationSeconds] = useState<number>(5)
  const [voiceId, setVoiceId] = useState<string>("rachel")
  const [stylePreset, setStylePreset] = useState<string>("Photorealistic Cinematic")

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<AIStatusData | null>(null)
  const [copiedText, setCopiedText] = useState<boolean>(false)

  const currentStudio = STUDIOS.find((s) => s.id === activeStudio) || STUDIOS[0]

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await generationService.getAIStatus()
        setAiStatus(res)
      } catch (e) {
        console.warn("AI Status check deferred:", e)
      }
    }
    fetchStatus()
  }, [])

  const handleStudioChange = (mode: StudioMode) => {
    setActiveStudio(mode)
    const def = STUDIOS.find((s) => s.id === mode)
    if (def) {
      setPrompt(def.defaultPrompt)
      if (def.aspectRatios && !def.aspectRatios.includes(aspectRatio)) {
        setAspectRatio(def.aspectRatios[0])
      }
    }
    setActiveJob(null)
    setSavedSuccess(null)
    setErrorMessage(null)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setSavedSuccess(null)

    try {
      const parameters: Record<string, unknown> = {
        studio_type: currentStudio.id,
        aspect_ratio: aspectRatio,
        duration: durationSeconds,
        voice_id: voiceId,
        style_preset: stylePreset,
      }

      const job = await generationService.submitJob({
        modality: currentStudio.modality,
        prompt,
        parameters,
      })
      setActiveJob(job)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Generation failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveToPortfolio = async () => {
    if (!activeJob) return
    try {
      const res = await generationService.saveToPortfolio(
        activeJob.id,
        `${currentStudio.name} - ${prompt.slice(0, 32)}...`
      )
      setSavedSuccess(res.title)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save asset to portfolio")
    }
  }

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F4E7FF] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
              Creator Studio Suite
            </span>
            <Badge variant="purple">Multi-Modal Suite</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">AI Creation Studio</h1>
          <p className="text-[#4B4652] text-sm mt-1">
            Produce portfolio-ready generative assets across 6 dedicated studios with unified backend routing.
          </p>
        </div>

        {/* Infrastructure Status Pills */}
        {aiStatus && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white border border-[#F4E7FF] text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-[#4B4652]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#111111]">Gateway:</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4E7FF]/60 text-[#9A6ADF] font-medium border border-[#D8B8FF]/60">
              Image: {aiStatus.image.is_fallback ? "Ready (Simulation)" : aiStatus.image.provider}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4E7FF]/60 text-[#9A6ADF] font-medium border border-[#D8B8FF]/60">
              Video: {aiStatus.video.is_fallback ? "Ready (Simulation)" : aiStatus.video.provider}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4E7FF]/60 text-[#9A6ADF] font-medium border border-[#D8B8FF]/60">
              Voice: {aiStatus.voice.is_fallback ? "Ready (Simulation)" : aiStatus.voice.provider}
            </span>
          </div>
        )}
      </div>

      {/* Studio Module Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STUDIOS.map((s) => {
          const Icon = s.icon
          const isActive = activeStudio === s.id
          return (
            <button
              key={s.id}
              onClick={() => handleStudioChange(s.id)}
              className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-[#F4E7FF] border-[#9A6ADF] text-[#9A6ADF] shadow-xs ring-1 ring-[#9A6ADF]/40"
                  : "bg-white border-[#F4E7FF] text-[#4B4652] hover:text-[#9A6ADF] hover:bg-[#F4E7FF]/40"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive ? "bg-[#9A6ADF] text-white" : "bg-[#F4E7FF]/60 text-[#9A6ADF]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <Badge variant={isActive ? "purple" : "outline"} className="text-[10px] bg-white">
                  {s.modality}
                </Badge>
              </div>
              <span className={`text-xs font-bold ${isActive ? "text-[#9A6ADF]" : "text-[#111111]"}`}>
                {s.name}
              </span>
              <span className="text-[10px] text-[#4B4652] line-clamp-1 mt-0.5">{s.id.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Studio Workspace Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Studio Controls & Prompt Input */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white border border-[#F4E7FF] rounded-2xl shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-2">
                <currentStudio.icon className="h-5 w-5 text-[#9A6ADF]" />
                <CardTitle className="text-lg font-bold text-[#111111]">{currentStudio.name}</CardTitle>
              </div>
              <CardDescription className="text-xs text-[#4B4652]">{currentStudio.tagline}</CardDescription>
            </CardHeader>

            <form onSubmit={handleGenerate}>
              <CardContent className="space-y-5">
                {errorMessage && (
                  <Alert variant="error" className="text-xs">
                    {errorMessage}
                  </Alert>
                )}

                {/* Modality Specific Controls */}
                {currentStudio.aspectRatios && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-[#9A6ADF]" />
                      Aspect Ratio
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentStudio.aspectRatios.map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setAspectRatio(ar)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            aspectRatio === ar
                              ? "bg-[#9A6ADF] border-[#9A6ADF] text-white shadow-xs"
                              : "bg-white border-[#D8B8FF] text-[#4B4652] hover:bg-[#F4E7FF]/40"
                          }`}
                        >
                          {ar === "1:1" ? "1:1 Square" : ar === "16:9" ? "16:9 Cinematic" : "9:16 Vertical"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Duration Selector */}
                {currentStudio.id === "video" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111111]">Target Duration</label>
                    <div className="flex gap-2">
                      {[5, 10].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setDurationSeconds(sec)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            durationSeconds === sec
                              ? "bg-[#9A6ADF] border-[#9A6ADF] text-white"
                              : "bg-white border-[#D8B8FF] text-[#4B4652] hover:bg-[#F4E7FF]/40"
                          }`}
                        >
                          {sec} Seconds ({sec * 24} frames)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice Model Selector */}
                {currentStudio.id === "voice" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111111]">Voice Profile</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "rachel", label: "Rachel (Warm & Commercial)" },
                        { id: "adam", label: "Adam (Deep & Authoritative)" },
                        { id: "nicole", label: "Nicole (Dynamic Gen-Z)" },
                        { id: "antoni", label: "Antoni (Narrative Storyteller)" },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVoiceId(v.id)}
                          className={`p-2.5 rounded-xl text-xs text-left border transition-all cursor-pointer ${
                            voiceId === v.id
                              ? "bg-[#F4E7FF] border-[#9A6ADF] text-[#9A6ADF] font-bold"
                              : "bg-white border-[#D8B8FF] text-[#4B4652] hover:bg-[#F4E7FF]/40"
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Style Preset Selector */}
                {currentStudio.id === "image" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111111]">Style Aesthetic</label>
                    <select
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      className="w-full rounded-xl border border-[#D8B8FF] bg-[#FFFDFD] p-2.5 text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40"
                    >
                      <option value="Photorealistic Cinematic">Photorealistic Cinematic (ARRI Alexa, 35mm)</option>
                      <option value="Cyberpunk & Neon Noir">Cyberpunk & Neon Noir (Volumetric Rain)</option>
                      <option value="Minimalist Luxury">Minimalist Luxury (High Dynamic Range)</option>
                      <option value="3D Clay & Isometric">3D Clay & Isometric Render (Octane)</option>
                      <option value="Anime & Manga Concept">Anime & Manga Concept Art</option>
                    </select>
                  </div>
                )}

                {/* Creative Prompt Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#111111]">Creative Directives & Prompt</label>
                    <span className="text-[11px] text-[#4B4652] font-mono">{prompt.length} / 12,000 chars</span>
                  </div>
                  <textarea
                    rows={5}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={currentStudio.placeholder}
                    required
                    className="w-full rounded-xl border border-[#D8B8FF] bg-[#FFFDFD] p-3.5 text-xs text-[#111111] placeholder:text-[#4B4652]/60 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40 resize-y shadow-2xs"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-[#F4E7FF] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(currentStudio.defaultPrompt)}
                  className="text-xs text-[#4B4652]"
                >
                  Reset Template
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2 text-xs">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating with AI Gateway...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Execute {currentStudio.name}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Output Preview & Portfolio Actions */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="overflow-hidden bg-white border border-[#F4E7FF] rounded-2xl shadow-xs">
            <CardHeader className="bg-[#F4E7FF]/30 border-b border-[#F4E7FF]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-[#9A6ADF]" />
                  <CardTitle className="text-base font-bold text-[#111111]">Studio Output Preview</CardTitle>
                </div>
                {activeJob && (
                  <Badge variant={activeJob.status === "COMPLETED" ? "purple" : "outline"}>
                    {activeJob.status}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {isSubmitting ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-[#F4E7FF] border border-[#D8B8FF] text-[#9A6ADF] animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111111]">Synthesizing Creative Output</p>
                    <p className="text-xs text-[#4B4652] mt-1 max-w-xs">
                      Dispatching to multi-modal gateway with automated fallback resilience...
                    </p>
                  </div>
                </div>
              ) : activeJob && activeJob.status === "COMPLETED" ? (
                <div className="space-y-4">
                  {/* Image Preview */}
                  {currentStudio.modality === "IMAGE" && activeJob.resultAssetPath && (
                    <div className="rounded-xl overflow-hidden border border-[#F4E7FF] bg-slate-50 group relative">
                      <ImageWithFallback
                        src={activeJob.resultAssetPath}
                        alt="Generated preview"
                        category="Studio Image Output"
                        iconType="camera"
                        fallbackText="Generated Concept Preview"
                        className="w-full h-auto object-cover max-h-[420px]"
                        containerClassName="w-full h-auto"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge variant="purple" className="backdrop-blur-md bg-white/90">
                          {aspectRatio}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Video Preview */}
                  {currentStudio.modality === "VIDEO" && activeJob.resultAssetPath && (
                    <div className="rounded-xl overflow-hidden border border-[#F4E7FF] bg-black">
                      <video
                        src={activeJob.resultAssetPath}
                        controls
                        autoPlay
                        loop
                        muted
                        className="w-full h-auto max-h-[380px]"
                      />
                    </div>
                  )}

                  {/* Voice / Audio Preview */}
                  {currentStudio.modality === "AUDIO" && activeJob.resultAssetPath && (
                    <div className="p-6 rounded-xl border border-[#F4E7FF] bg-[#F4E7FF]/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-[#9A6ADF] text-white">
                          <Play className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111111]">Narrator: {voiceId.toUpperCase()}</p>
                          <p className="text-xs text-[#4B4652]">Generated Voiceover Track</p>
                        </div>
                      </div>
                      <audio src={activeJob.resultAssetPath} controls className="w-full" />
                    </div>
                  )}

                  {/* Text / Markdown Output */}
                  {currentStudio.modality === "TEXT" && activeJob.resultAssetPath && (
                    <div className="relative p-4 rounded-xl border border-[#D8B8FF] bg-[#F4E7FF]/20 text-xs text-[#111111] font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeJob.resultAssetPath || "")}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-[#D8B8FF] hover:bg-[#F4E7FF]/50 text-[#4B4652] transition-colors"
                        title="Copy text"
                      >
                        {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      {activeJob.resultAssetPath}
                    </div>
                  )}

                  {/* Metadata & Provider Details */}
                  <div className="p-3 rounded-xl bg-[#F4E7FF]/30 border border-[#D8B8FF] text-[11px] text-[#4B4652] space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">Provider:</span>
                      <span className="font-mono text-[#111111] font-bold">{activeJob.providerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Job ID:</span>
                      <span className="font-mono text-[#4B4652]">{activeJob.id.slice(0, 18)}...</span>
                    </div>
                  </div>

                  {/* Save to Portfolio Action */}
                  <div className="pt-2">
                    {savedSuccess ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Saved to Creator Portfolio!</span>
                        </div>
                        <Link to="/creator/portfolio">
                          <Button variant="outline" size="sm" className="text-xs gap-1 bg-white">
                            View Portfolio <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSaveToPortfolio}
                        className="w-full gap-2 text-xs font-bold text-[#9A6ADF]"
                      >
                        <FolderPlus className="h-4 w-4 text-[#9A6ADF]" />
                        Save to Creator Portfolio
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-[#4B4652] text-xs space-y-3">
                  <div className="p-3 w-12 h-12 mx-auto rounded-full bg-[#F4E7FF] border border-[#D8B8FF] flex items-center justify-center text-[#9A6ADF]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#111111]">Ready for Creative Synthesis</p>
                    <p className="mt-1 text-[11px] text-[#4B4652] max-w-xs mx-auto">
                      Adjust your prompt and parameters on the left, then click Execute to synthesize.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

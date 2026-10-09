import React, { useState, useEffect } from "react"
import { creatorsService } from "@/services/creators.service"
import { AnimatedTestimonials, type CreatorShowcaseItem } from "@/components/ui/animated-testimonials"
import { Sparkles, Users, Loader2 } from "lucide-react"

export const AnimatedCreatorShowcase: React.FC = () => {
  const [showcaseCreators, setShowcaseCreators] = useState<CreatorShowcaseItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeaturedCreators() {
      try {
        const creators = await creatorsService.listCreators(0, 5)
        if (creators && creators.length > 0) {
          const formatted: CreatorShowcaseItem[] = creators.map((c) => ({
            id: c.id,
            name: c.full_name || c.fullName || "AI Creator",
            specialization: c.primary_specialization || c.primarySpecialization || "Generative Directing",
            headline: c.headline,
            bio: c.bio,
            avatarOrThumbnail:
              c.metadata?.thumbnail_url ||
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
            tools: c.ai_tools || c.aiTools || ["Midjourney", "Runway Gen-3"],
            levelName: c.level_name || (c.level ? c.level.replace(/_/g, " ") : "AI Master"),
            isVerified: c.is_verified,
            profileUrl: `/creators/${c.id}`,
            isDevFixture: false,
          }))
          setShowcaseCreators(formatted)
        } else {
          // Clearly labeled development fixtures
          setShowcaseCreators([
            {
              id: "dev-001",
              name: "Alex Rivera",
              specialization: "Photorealistic Cinematic Video & Midjourney v6",
              headline: "Senior AI Cinematographer crafting brand commercials",
              bio: "Directs photorealistic video pipelines using Runway Gen-3 Alpha, custom ComfyUI workflows, and ElevenLabs audio scores.",
              avatarOrThumbnail:
                "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
              tools: ["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"],
              levelName: "AI Master",
              isVerified: true,
              profileUrl: "/creators/00000000-0000-0000-0000-000000000001",
              isDevFixture: true,
            },
            {
              id: "dev-002",
              name: "Maya Lin",
              specialization: "Stylized 3D Animation & Character Concept",
              headline: "3D Animation lead specialized in continuous character worlds",
              bio: "Pioneering consistent character rigging with diffusion models, Luma Dream Machine motion, and anime styles.",
              avatarOrThumbnail:
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
              tools: ["Luma Dream Machine", "Flux.1", "Blender AI", "Topaz"],
              levelName: "Pro Creator",
              isVerified: true,
              profileUrl: "/creators/dev-002",
              isDevFixture: true,
            },
          ])
        }
      } catch (err) {
        console.error("Failed to load featured creators:", err)
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedCreators()
  }, [])

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span className="text-xs">Loading featured AI creators...</span>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
            <Users className="w-4 h-4" />
            <span>Featured Marketplace Creators</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Meet the Creative Minds Behind Your Next Campaign
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Explore AI-native creators, their creative specialties, and the work they can bring to your brand.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 border border-purple-100 shadow-sm overflow-hidden">
        <AnimatedTestimonials creators={showcaseCreators} autoplay={true} />
      </div>
    </section>
  )
}

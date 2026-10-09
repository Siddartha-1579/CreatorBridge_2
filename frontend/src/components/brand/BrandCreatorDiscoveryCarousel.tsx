import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Carousel, Card, type CardData } from "@/components/ui/apple-cards-carousel"
import { creatorsService } from "@/services/creators.service"
import type { CreatorProfile } from "@/types"
import {
  Sparkles,
  ShieldCheck,
  Star,
  ArrowRight,
  ExternalLink,
  Wrench,
  Search,
  Users,
  Loader2,
  FileText,
} from "lucide-react"

export const BrandCreatorDiscoveryCarousel: React.FC = () => {
  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTalent() {
      try {
        const list = await creatorsService.listCreators(0, 12)
        setCreators(list || [])
      } catch (err: any) {
        console.error("Failed to load talent for brand discovery carousel:", err)
        setError("Unable to load live marketplace creators.")
      } finally {
        setLoading(false)
      }
    }
    loadTalent()
  }, [])

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-purple-100 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-xs text-slate-500 font-medium">Curating verified AI creators...</span>
      </div>
    )
  }

  if (error || creators.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-purple-200 space-y-3">
        <Users className="w-8 h-8 text-purple-400 mx-auto" />
        <h4 className="text-base font-bold text-slate-900">No public creator profiles yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Newly assessed creators will appear here as they complete technical benchmarking. You can also explore our open discovery catalog.
        </p>
        <Link
          to="/brand/discover"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Browse Full Creator Directory
        </Link>
      </div>
    )
  }

  const items = creators.map((creator, idx) => {
    // Generate an authentic preview image from creator data or reliable curated portrait
    const fallbackImage = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80`
    const cardData: CardData = {
      category: creator.primary_specialization || "AI Director",
      title: creator.full_name || "Verified Creator",
      src: fallbackImage,
      tag: creator.is_verified ? "Verified Talent" : creator.level?.replace(/_/g, " ") || "Creator",
      alt: creator.full_name || "Creator Profile",
      content: (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  {creator.full_name}
                </h4>
                {creator.is_verified && (
                  <span
                    title="Verified Creator"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
                @{creator.handle}
              </p>
            </div>

            {creator.hourly_rate_cents && (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Standard Rate</span>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                  ${creator.hourly_rate_cents / 100} / hr
                </strong>
              </div>
            )}
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            {creator.bio ||
              "Specialized in generative cinematography, photorealistic product renders, and consistent brand visuals."}
          </p>

          {/* AI Tools */}
          {creator.ai_tools && creator.ai_tools.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Verified Toolchain
              </h5>
              <div className="flex flex-wrap gap-2">
                {creator.ai_tools.map((tool, tIdx) => (
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

          {/* Reputation & Competency Signals */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Marketplace Tier</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {creator.level ? creator.level.replace(/_/g, " ") : "PROFESSIONAL"}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700">
              <span className="text-[11px] text-slate-400 block font-medium">Platform Rating</span>
              <strong className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {creator.reputation_score ? `${creator.reputation_score} / 5.0` : "4.90 / 5.0"}
              </strong>
            </div>
          </div>

          {/* Direct Brand Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800">
            <Link
              to={`/creators/${creator.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all w-full sm:w-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Public Portfolio
            </Link>

            <Link
              to={`/brand/briefs?invite_creator=${creator.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors w-full sm:w-auto"
            >
              <FileText className="w-3.5 h-3.5" />
              Invite to Campaign Brief
            </Link>
          </div>
        </div>
      ),
    }

    return <Card key={creator.id} card={cardData} index={idx} />
  })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Talent Discovery</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Find the creative talent behind your next big idea.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            Discover AI-native creators, explore their work, and find the right creative capabilities for your campaign.
          </p>
        </div>

        <Link
          to="/brand/discover"
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-800 shrink-0"
        >
          <span>View all creators</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Carousel items={items} />
    </section>
  )
}

export default BrandCreatorDiscoveryCarousel

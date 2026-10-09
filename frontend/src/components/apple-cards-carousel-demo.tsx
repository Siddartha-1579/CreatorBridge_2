import React from "react"
import { Carousel, Card, type CardData } from "@/components/ui/apple-cards-carousel"

const DEMO_CARDS: CardData[] = [
  {
    category: "AI Filmmaking",
    title: "Cinematic Multi-Shot Commercials",
    src: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
          Learn how AI directors leverage camera-path conditioning, character consistency seeds, and neural rendering to craft commercial video for leading brands.
        </p>
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-zinc-800 border border-purple-100 text-xs space-y-1">
          <strong className="text-purple-900 dark:text-purple-300 block">Deliverables</strong>
          <span className="text-slate-600 dark:text-zinc-400">4K 60fps Masters, Aspect Ratio Variations (16:9, 9:16)</span>
        </div>
      </div>
    ),
  },
  {
    category: "Generative Art",
    title: "Hyper-Real Architectural Staging",
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
          Ultra-resolution generative environments staged with Midjourney v6 and Magnific Relight pipelines.
        </p>
      </div>
    ),
  },
]

export const AppleCardsCarouselDemo: React.FC = () => {
  const cards = DEMO_CARDS.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ))

  return (
    <div className="w-full py-12">
      <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
        Explore AI Specializations
      </h2>
      <Carousel items={cards} />
    </div>
  )
}

export default AppleCardsCarouselDemo

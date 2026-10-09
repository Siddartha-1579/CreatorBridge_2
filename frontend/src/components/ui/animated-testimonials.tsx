import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

export interface CreatorShowcaseItem {
  id: string
  name: string
  specialization: string
  headline?: string
  bio?: string
  avatarOrThumbnail: string
  tools: string[]
  levelName?: string
  isVerified?: boolean
  profileUrl: string
  isDevFixture?: boolean
}

interface AnimatedTestimonialsProps {
  creators: CreatorShowcaseItem[]
  autoplay?: boolean
  className?: string
}

export const AnimatedTestimonials: React.FC<AnimatedTestimonialsProps> = ({
  creators,
  autoplay = false,
  className = "",
}) => {
  const [active, setActive] = useState(0)

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % creators.length)
  }, [creators.length])

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + creators.length) % creators.length)
  }, [creators.length])

  const isActive = (index: number) => index === active

  useEffect(() => {
    if (autoplay && creators.length > 1) {
      const interval = setInterval(handleNext, 6000)
      return () => clearInterval(interval)
    }
  }, [autoplay, handleNext, creators.length])

  const randomRotateY = (idx: number) => {
    const seed = (idx * 7) % 16
    return seed - 8
  }

  if (!creators || creators.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-purple-100 shadow-2xs">
        <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-2" />
        <h4 className="text-base font-bold text-slate-800">No public creators available yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          When AI creators publish their showcase profiles, they will be highlighted here for your campaigns.
        </p>
      </div>
    )
  }

  const current = creators[active]

  return (
    <div className={`max-w-6xl mx-auto px-4 md:px-8 py-8 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        {/* Animated Stacked Visuals */}
        <div className="relative h-80 sm:h-96 w-full flex items-center justify-center">
          <AnimatePresence>
            {creators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  z: -100,
                  rotate: randomRotateY(index),
                }}
                animate={{
                  opacity: isActive(index) ? 1 : 0.6,
                  scale: isActive(index) ? 1 : 0.94,
                  z: isActive(index) ? 0 : -100,
                  rotate: isActive(index) ? 0 : randomRotateY(index),
                  zIndex: isActive(index) ? 99 : creators.length + 2 - index,
                  y: isActive(index) ? [0, -4, 0] : 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  z: 100,
                  rotate: randomRotateY(index),
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 origin-bottom"
              >
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                  <img
                    src={creator.avatarOrThumbnail}
                    alt={creator.name}
                    draggable={false}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Gradient shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Badges on Visual */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    {creator.isVerified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified AI Creator
                      </span>
                    )}
                    {creator.levelName && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-600/90 text-white backdrop-blur-md ml-auto">
                        {creator.levelName}
                      </span>
                    )}
                  </div>

                  {creator.isDevFixture && (
                    <div className="absolute bottom-3 left-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/60 px-2 py-0.5 rounded">
                        Dev Sample Profile
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Creator Info & Editorial Introduction */}
        <div className="flex justify-between flex-col py-4 space-y-6">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {current.name}
                </h3>
              </div>
              <p className="text-sm font-semibold text-purple-700 mt-1">
                {current.specialization}
              </p>
              {current.headline && (
                <p className="text-xs text-slate-500 italic mt-0.5">
                  "{current.headline}"
                </p>
              )}
            </div>

            {/* Factual Bio / Summary */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {current.bio || "Specialized in generative cinematography, prompt continuity, and commercial-grade AI visual assets for advertising campaigns."}
            </p>

            {/* Certified Tools List */}
            {current.tools && current.tools.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Certified Generative Toolchain
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {current.tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action button: View Creator Profile */}
            <div className="pt-2">
              <Link
                to={current.profileUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
              >
                <span>View Full AI Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-purple-100">
            <span className="text-xs font-medium text-slate-400">
              {active + 1} of {creators.length} Featured Creators
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous Creator"
                className="w-10 h-10 rounded-full bg-white border border-purple-200 flex items-center justify-center text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next Creator"
                className="w-10 h-10 rounded-full bg-white border border-purple-200 flex items-center justify-center text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-2xs"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

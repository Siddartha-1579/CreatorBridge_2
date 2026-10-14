import React from "react"
import { Link } from "react-router-dom"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, ArrowRight, Video, CheckCircle2, ShieldCheck, Film, Layers } from "lucide-react"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"

export interface Marketplace3DCardProps {
  title: string
  description: string
  image?: string
  category?: string
  tags?: string[]
  metadata?: Record<string, string | number>
  badge?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  variant?: "creator" | "brand" | "brief" | "portfolio" | "feature" | "showcase"
  className?: string
  containerClassName?: string
  children?: React.ReactNode
}

export const Marketplace3DCard: React.FC<Marketplace3DCardProps> = ({
  title,
  description,
  image,
  category,
  tags = [],
  metadata = {},
  badge,
  action,
  variant = "creator",
  className,
  containerClassName,
  children,
}) => {
  const isCreatorVariant = variant === "creator"
  const isBrandVariant = variant === "brand" || variant === "brief"

  return (
    <CardContainer containerClassName={cn("py-4", containerClassName)}>
      <CardBody
        className={cn(
          "relative group/card w-full max-w-full sm:max-w-md md:max-w-lg h-auto rounded-2xl p-6 sm:p-7 border transition-all duration-300",
          // Premium Light Purple + White / Subtle Neutral Palette with Depth
          "bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl",
          "border-purple-100 dark:border-purple-900/30",
          "shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/15",
          "hover:border-purple-300 dark:hover:border-purple-700/60",
          className
        )}
      >
        {/* Subtle Ambient Radial Glow on Hover */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Top Header Row: Category & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {category && (
            <CardItem
              translateZ="30"
              className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3" />
              {category}
            </CardItem>
          )}

          {badge && (
            <CardItem translateZ="40">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                {isCreatorVariant && <CheckCircle2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                {isBrandVariant && <ShieldCheck className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                {badge}
              </span>
            </CardItem>
          )}
        </div>

        {/* Title */}
        <CardItem
          as="h3"
          translateZ="50"
          className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
        >
          {title}
        </CardItem>

        {/* Description */}
        <CardItem
          as="p"
          translateZ="40"
          className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed"
        >
          {description}
        </CardItem>

        {/* Media / Visual Layer */}
        {image && (
          <CardItem
            translateZ="80"
            rotateX={6}
            rotateZ={-2}
            className="w-full mt-5 relative rounded-xl overflow-hidden border border-purple-100 dark:border-zinc-800 group-hover/card:shadow-xl group-hover/card:shadow-purple-500/10 transition-shadow duration-300"
          >
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-xl">
              <ImageWithFallback
                src={image}
                alt={title}
                category={category}
                iconType={isCreatorVariant ? "film" : "layers"}
                fallbackText={title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                containerClassName="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-80 pointer-events-none" />

              {/* Floating Media Indicator */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-md font-medium text-[11px]">
                  {isCreatorVariant ? (
                    <>
                      <Film className="h-3 w-3 text-purple-400" /> AI Reel
                    </>
                  ) : (
                    <>
                      <Layers className="h-3 w-3 text-purple-400" /> Deliverable Spec
                    </>
                  )}
                </span>
                <span className="text-[10px] text-zinc-300 bg-black/40 px-2 py-0.5 rounded">
                  {variant.toUpperCase()} PREVIEW
                </span>
              </div>
            </div>
          </CardItem>
        )}

        {/* Custom Body Children */}
        {children && (
          <CardItem translateZ="35" className="w-full mt-4">
            {children}
          </CardItem>
        )}

        {/* Metadata Grid */}
        {metadata && Object.keys(metadata).length > 0 && (
          <CardItem translateZ="35" className="w-full mt-4 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(metadata).map(([key, value]) => (
              <div
                key={key}
                className="p-2 rounded-lg bg-purple-50/60 dark:bg-zinc-900/60 border border-purple-100/80 dark:border-zinc-800"
              >
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-semibold">
                  {key}
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                  {String(value)}
                </span>
              </div>
            ))}
          </CardItem>
        )}

        {/* Tags / AI Tools */}
        {tags && tags.length > 0 && (
          <CardItem translateZ="45" className="w-full mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-purple-100/60 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
              >
                {tag}
              </span>
            ))}
          </CardItem>
        )}

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <CardItem
            translateZ="30"
            className="text-xs text-zinc-500 dark:text-zinc-400 font-medium"
          >
            {isCreatorVariant && "Verified Workflow"}
            {isBrandVariant && "Commercial Rights Escrow"}
            {!isCreatorVariant && !isBrandVariant && "Verified Spec"}
          </CardItem>

          {action && (
            <CardItem translateZ="60" translateX={10}>
              {action.href ? (
                action.href.startsWith("/") ? (
                  <Link
                    to={action.href}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-colors"
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <a
                    href={action.href}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-colors"
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                )
              ) : (
                <Button
                  onClick={action.onClick}
                  size="sm"
                  variant="primary"
                  className="gap-1.5 text-xs font-semibold shadow-md shadow-purple-600/20"
                >
                  {action.label}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </CardItem>
          )}
        </div>
      </CardBody>
    </CardContainer>
  )
}

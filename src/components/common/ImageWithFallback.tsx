import React, { useState, useEffect } from "react"
import { Film, Sparkles, Layers, Camera, Briefcase, User, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type FallbackIconType = "film" | "sparkles" | "layers" | "camera" | "briefcase" | "user" | "image"

export interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null
  alt: string
  className?: string
  containerClassName?: string
  category?: string
  iconType?: FallbackIconType
  fallbackText?: string
  fallbackSrc?: string
  aspectRatio?: "video" | "square" | "portrait" | "banner" | "auto"
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className,
  containerClassName,
  category,
  iconType,
  fallbackText,
  fallbackSrc,
  aspectRatio = "auto",
  ...imgProps
}) => {
  const [hasError, setHasError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [triedFallbackSrc, setTriedFallbackSrc] = useState(false)

  // Reset error state if the src prop changes
  useEffect(() => {
    setHasError(false)
    setLoaded(false)
    setTriedFallbackSrc(false)
  }, [src])

  const getIcon = () => {
    switch (iconType) {
      case "film":
        return <Film className="w-6 h-6 text-[#9A6ADF]" />
      case "sparkles":
        return <Sparkles className="w-6 h-6 text-[#9A6ADF]" />
      case "layers":
        return <Layers className="w-6 h-6 text-[#9A6ADF]" />
      case "camera":
        return <Camera className="w-6 h-6 text-[#9A6ADF]" />
      case "briefcase":
        return <Briefcase className="w-6 h-6 text-[#9A6ADF]" />
      case "user":
        return <User className="w-6 h-6 text-[#9A6ADF]" />
      default:
        return <ImageIcon className="w-6 h-6 text-[#9A6ADF]" />
    }
  }

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "video":
        return "aspect-video"
      case "square":
        return "aspect-square"
      case "portrait":
        return "aspect-[3/4]"
      case "banner":
        return "aspect-[21/9]"
      default:
        return ""
    }
  }

  // Determine effective source to load
  const effectiveSrc = !src
    ? fallbackSrc || null
    : hasError && fallbackSrc && !triedFallbackSrc
    ? fallbackSrc
    : hasError
    ? null
    : src

  const handleImgError = () => {
    if (fallbackSrc && !triedFallbackSrc && src !== fallbackSrc) {
      setTriedFallbackSrc(true)
    } else {
      setHasError(true)
    }
  }

  // If no effective source or both original and fallback failed, show deliberate placeholder
  if (!effectiveSrc || (hasError && (triedFallbackSrc || !fallbackSrc))) {
    return (
      <div
        className={cn(
          "w-full h-full min-h-[140px] rounded-xl flex flex-col items-center justify-center p-4 text-center relative overflow-hidden select-none",
          "bg-gradient-to-br from-[#F4E7FF] via-[#FFFDFD] to-[#FFF4E5] border border-[#D8B8FF]/60",
          getAspectClass(),
          containerClassName
        )}
        role="img"
        aria-label={alt || "CreatorBridge preview placeholder"}
      >
        {/* Subtle decorative geometric backdrop rings */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#9A6ADF]/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#FFD7A8]/20 blur-xl pointer-events-none" />

        {/* Central Icon Disc */}
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#D8B8FF] flex items-center justify-center mb-2.5 z-10 shrink-0">
          {getIcon()}
        </div>

        {/* Category Badge if available */}
        {category && (
          <span className="z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#9A6ADF] border border-[#D8B8FF]/70 mb-1.5 shadow-2xs">
            {category}
          </span>
        )}

        {/* Title / Description */}
        <span className="z-10 text-xs font-bold text-[#111111] line-clamp-1 max-w-[85%]">
          {fallbackText || alt || "Creative Showcase Asset"}
        </span>

        {/* Watermark Label */}
        <span className="z-10 text-[10px] font-medium text-[#4B4652]/80 mt-0.5">
          CreatorBridge Curated Showcase
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden",
        getAspectClass(),
        containerClassName
      )}
    >
      <img
        src={effectiveSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={handleImgError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...imgProps}
      />
      {!loaded && !hasError && (
        <div className="absolute inset-0 bg-[#F4E7FF]/30 animate-pulse pointer-events-none" />
      )}
    </div>
  )
}

export default ImageWithFallback

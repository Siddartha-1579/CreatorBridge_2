import React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface CreatorBridgeLogoProps {
  to?: string
  className?: string
  size?: "sm" | "md" | "lg"
  badgeText?: string
}

export const CreatorBridgeLogo: React.FC<CreatorBridgeLogoProps> = ({
  to = "/",
  className,
  size = "md",
  badgeText,
}) => {
  const heightClasses = {
    sm: "h-8",
    md: "h-9 sm:h-10",
    lg: "h-11 sm:h-12",
  }

  const logoContent = (
    <div className={cn("inline-flex items-center gap-2.5 group cursor-pointer", className)}>
      <img
        src="/creatorbridge-logo-transparent.png"
        alt="CreatorBridge - Where Brands Meet Creativity"
        className={cn(
          "w-auto object-contain transition-transform group-hover:scale-[1.02]",
          heightClasses[size]
        )}
      />
      {badgeText && (
        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF]">
          {badgeText}
        </span>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} aria-label="CreatorBridge - Where Brands Meet Creativity" className="focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40 rounded-lg p-0.5">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}

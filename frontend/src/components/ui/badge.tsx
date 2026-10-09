import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "purple" | "peach"
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-[#F4E7FF] text-[#9A6ADF] border-[#D8B8FF]",
    secondary: "bg-white text-[#4B4652] border-[#D8B8FF]",
    outline: "border-[#D8B8FF] text-[#4B4652] bg-transparent",
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-800 border-amber-500/30",
    purple: "bg-[#F4E7FF] text-[#9A6ADF] border-[#D8B8FF]",
    peach: "bg-[#FFF4E5] text-[#b46b14] border-[#FFD7A8]",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

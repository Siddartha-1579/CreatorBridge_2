import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "purple" | "peach"
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-[#F4E7FF] dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] border-[#D8B8FF] dark:border-[#3E325D]",
    secondary: "bg-white dark:bg-[#181524] text-[#4B4652] dark:text-[#C7C3D4] border-[#D8B8FF] dark:border-[#3E325D]",
    outline: "border-[#D8B8FF] dark:border-[#3E325D] text-[#4B4652] dark:text-[#C7C3D4] bg-transparent",
    success: "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-500/30",
    purple: "bg-[#F4E7FF] dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] border-[#D8B8FF] dark:border-[#3E325D]",
    peach: "bg-[#FFF4E5] dark:bg-[#342416] text-[#b46b14] dark:text-[#f0b561] border-[#FFD7A8] dark:border-[#523E28]",
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

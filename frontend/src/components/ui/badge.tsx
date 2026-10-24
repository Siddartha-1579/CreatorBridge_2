import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "purple" | "peach"
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-primary,#8B0015)] border-[var(--color-border,#EADCDF)]",
    secondary: "bg-[var(--color-surface,#FFFFFF)] text-[var(--color-text-muted,#5E454B)] border-[var(--color-border,#EADCDF)]",
    outline: "border-[var(--color-border,#EADCDF)] text-[var(--color-text-muted,#5E454B)] bg-transparent",
    success: "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-500/30",
    purple: "bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-primary,#8B0015)] border-[var(--color-border,#EADCDF)]",
    peach: "bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-highlight,#C9A46A)] border-[var(--color-border,#EADCDF)]",
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

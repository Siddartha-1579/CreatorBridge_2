import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring,#8B0015)]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"

    const variants = {
      primary: "bg-[var(--color-primary,#8B0015)] hover:bg-[var(--color-primary-hover,#6D0010)] text-[var(--color-primary-foreground,#FFFFFF)] shadow-sm shadow-[var(--color-primary,#8B0015)]/25",
      secondary: "bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-text,#1D0B10)] border border-[var(--color-border,#EADCDF)] hover:border-[var(--color-border-hover,#C9A46A)] shadow-xs",
      outline: "border border-[var(--color-border,#EADCDF)] hover:border-[var(--color-border-hover,#C9A46A)] hover:bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-text,#1D0B10)]",
      ghost: "hover:bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-text-muted,#5E454B)] hover:text-[var(--color-text,#1D0B10)]",
      danger: "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800",
    }

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

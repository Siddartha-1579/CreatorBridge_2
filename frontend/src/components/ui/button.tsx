import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"

    const variants = {
      primary: "bg-[#9A6ADF] hover:bg-[#8655cb] text-white shadow-sm shadow-[#9A6ADF]/25",
      secondary: "bg-white hover:bg-[#F4E7FF]/50 text-[#111111] border border-[#D8B8FF] shadow-xs",
      outline: "border border-[#D8B8FF] hover:bg-[#F4E7FF]/40 text-[#111111]",
      ghost: "hover:bg-[#F4E7FF]/50 text-[#4B4652] hover:text-[#111111]",
      danger: "bg-red-600 hover:bg-red-700 text-white",
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

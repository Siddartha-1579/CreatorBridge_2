import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#D8B8FF] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#4B4652]/60 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40 focus:border-[#9A6ADF] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

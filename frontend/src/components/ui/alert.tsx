import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "error" | "warning" | "info"
}

export const Alert: React.FC<AlertProps> = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-[#F4E7FF]/50 text-[#111111] border-[#D8B8FF]",
    error: "bg-red-50 text-red-900 border-red-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    info: "bg-purple-50 text-purple-900 border-purple-200",
  }

  return (
    <div
      role="alert"
      className={cn("relative w-full rounded-xl border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11", variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}

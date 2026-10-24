import React from "react"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { isDark, toggleTheme, theme } = useTheme()

  const label = isDark ? "Switch to light theme" : "Switch to dark theme"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={`${label} (currently ${theme === "system" ? "system default" : theme})`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium transition-all cursor-pointer",
        "text-[#4B4652] hover:text-[#9A6ADF] hover:bg-[#F4E7FF]/60 dark:text-[#C7C3D4] dark:hover:text-[#B78AF7] dark:hover:bg-[#231C35]",
        "border border-transparent hover:border-[#D8B8FF]/50 dark:hover:border-[#3E325D]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6ADF] focus-visible:ring-offset-1",
        className
      )}
    >
      <div className="relative h-4 w-4 shrink-0 flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-[#FFD7A8] transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="h-4 w-4 text-[#9A6ADF] transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  )
}

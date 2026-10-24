import React from "react"
import { ThemeSelector } from "./ThemeSelector"

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

/**
 * ThemeToggle now provides the full 6-Theme Customization Selector
 * with embedded dark/light mode toggle for seamless visual customization.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  return <ThemeSelector className={className} showLabel={showLabel} />
}

export { ThemeSelector }

import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import type { ThemeId, GlobalTheme } from "../types/theme"
import { THEMES, THEME_LIST, DEFAULT_THEME_ID, THEME_STORAGE_KEY, getThemeConfig } from "../config/themes"

export type ColorMode = "light" | "dark" | "system"
export type Theme = ColorMode

interface ThemeContextType {
  // Color mode (light/dark)
  theme: ColorMode
  resolvedTheme: "light" | "dark"
  isDark: boolean
  setTheme: (theme: ColorMode) => void
  toggleTheme: () => void

  // 6-Theme Palette Customization
  globalTheme: ThemeId
  activeTheme: GlobalTheme
  setGlobalTheme: (themeId: ThemeId) => void
  themes: GlobalTheme[]
}

const MODE_STORAGE_KEY = "creatorbridge_theme"

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Color mode state
  const [theme, setThemeState] = useState<ColorMode>(() => {
    if (typeof window === "undefined") return "system"
    try {
      const stored = localStorage.getItem(MODE_STORAGE_KEY) as ColorMode | null
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored
      }
    } catch {
      // Fallback
    }
    return "system"
  })

  // 2. Global marble theme state
  const [globalTheme, setGlobalThemeState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME_ID
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && stored in THEMES) {
        return stored as ThemeId
      }
    } catch {
      // Fallback
    }
    return DEFAULT_THEME_ID
  })

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme)

  // Listen to OS color scheme changes
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const resolvedTheme: "light" | "dark" = theme === "system" ? systemTheme : theme
  const isDark = resolvedTheme === "dark"
  const activeTheme = useMemo(() => getThemeConfig(globalTheme), [globalTheme])

  // Apply theme attributes and root variables
  useEffect(() => {
    const root = document.documentElement

    // 1. Data-theme attribute
    root.setAttribute("data-theme", globalTheme)

    // 2. Light / Dark class
    if (isDark) {
      root.classList.add("dark")
      root.style.colorScheme = "dark"
    } else {
      root.classList.remove("dark")
      root.style.colorScheme = "light"
    }

    // 3. Inject explicit CSS properties onto root style for instant inheritance
    const primary = isDark ? activeTheme.tokens.darkPrimary : activeTheme.palette.primary
    const primaryHover = isDark ? activeTheme.tokens.darkPrimaryHover : activeTheme.tokens.primaryHover
    const background = isDark ? activeTheme.tokens.darkBackground : activeTheme.palette.background
    const darkAccent = activeTheme.palette.darkAccent
    const highlight = isDark ? activeTheme.tokens.darkHighlight : activeTheme.palette.highlight
    const surface = isDark ? activeTheme.tokens.darkSurface : activeTheme.tokens.surface
    const surfaceElevated = isDark ? activeTheme.tokens.darkSurfaceElevated : activeTheme.tokens.surfaceElevated
    const surfaceMuted = isDark ? activeTheme.tokens.darkSurfaceMuted : activeTheme.tokens.surfaceMuted
    const text = isDark ? activeTheme.tokens.darkText : activeTheme.tokens.text
    const textMuted = isDark ? activeTheme.tokens.darkTextMuted : activeTheme.tokens.textMuted
    const border = isDark ? activeTheme.tokens.darkBorder : activeTheme.tokens.border
    const borderHover = isDark ? activeTheme.tokens.darkHighlight : activeTheme.tokens.borderHover

    root.style.setProperty("--color-primary", primary)
    root.style.setProperty("--color-primary-hover", primaryHover)
    root.style.setProperty("--color-primary-foreground", activeTheme.tokens.primaryForeground)
    root.style.setProperty("--color-background", background)
    root.style.setProperty("--color-dark-accent", darkAccent)
    root.style.setProperty("--color-highlight", highlight)
    root.style.setProperty("--color-surface", surface)
    root.style.setProperty("--color-surface-elevated", surfaceElevated)
    root.style.setProperty("--color-surface-muted", surfaceMuted)
    root.style.setProperty("--color-text", text)
    root.style.setProperty("--color-text-muted", textMuted)
    root.style.setProperty("--color-border", border)
    root.style.setProperty("--color-border-hover", borderHover)
    root.style.setProperty("--color-accent", isDark ? highlight : activeTheme.tokens.accent)
    root.style.setProperty("--color-focus-ring", isDark ? primary : activeTheme.tokens.focusRing)
    root.style.setProperty("--color-success", activeTheme.tokens.success)
    root.style.setProperty("--color-warning", activeTheme.tokens.warning)
    root.style.setProperty("--color-error", activeTheme.tokens.error)

    // Legacy backwards-compatibility variables
    root.style.setProperty("--cb-purple", primary)
    root.style.setProperty("--cb-purple-hover", primaryHover)
    root.style.setProperty("--cb-lavender", border)
    root.style.setProperty("--cb-lavender-soft", surfaceMuted)
    root.style.setProperty("--cb-peach", highlight)
    root.style.setProperty("--cb-peach-soft", surfaceMuted)
    root.style.setProperty("--cb-bg", background)
    root.style.setProperty("--cb-surface", surface)
    root.style.setProperty("--cb-border", border)
    root.style.setProperty("--cb-text-primary", text)
    root.style.setProperty("--cb-text-secondary", textMuted)
    root.style.setProperty("--cb-white", surface)
    root.style.setProperty("--cb-off-white", background)
  }, [globalTheme, isDark, activeTheme])

  const setTheme = (newTheme: ColorMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(MODE_STORAGE_KEY, newTheme)
    } catch {
      // Ignore storage errors
    }
  }

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
  }

  const setGlobalTheme = (themeId: ThemeId) => {
    if (themeId in THEMES) {
      setGlobalThemeState(themeId)
      try {
        localStorage.setItem(THEME_STORAGE_KEY, themeId)
      } catch {
        // Ignore storage errors
      }
    }
  }

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isDark,
      setTheme,
      toggleTheme,
      globalTheme,
      activeTheme,
      setGlobalTheme,
      themes: THEME_LIST,
    }),
    [theme, resolvedTheme, isDark, globalTheme, activeTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

import React, { useState, useRef, useEffect } from "react"
import {
  Palette,
  Check,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import { cn } from "@/lib/utils"
import type { GlobalTheme, ThemeId } from "@/types/theme"

interface ThemeSelectorProps {
  className?: string
  showLabel?: boolean
  compact?: boolean
  isMobileDrawer?: boolean
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className,
  showLabel = true,
  compact = false,
  isMobileDrawer = false,
}) => {
  const {
    globalTheme,
    setGlobalTheme,
    themes,
    activeTheme,
    isDark,
    toggleTheme,
  } = useTheme()

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useOutsideClick(menuRef, () => {
    if (isOpen) setIsOpen(false)
  })

  // Keyboard navigation (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "Escape") {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const handleSelect = (themeId: ThemeId) => {
    setGlobalTheme(themeId)
    setIsOpen(false)
  }

  // In mobile menu drawer, we can render the themes inline or expandable
  if (isMobileDrawer) {
    return (
      <div className="space-y-3 py-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
            <Palette className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Theme & Visual Appearance</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            {isDark ? <Sun className="w-3 h-3 text-[var(--color-highlight)]" /> : <Moon className="w-3 h-3 text-[var(--color-primary)]" />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {themes.map((t) => {
            const isSelected = t.id === globalTheme
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setGlobalTheme(t.id)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)] shadow-xs ring-1 ring-[var(--color-primary)]/30"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-text)]">
                      {t.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.2 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {t.tagline}
                  </p>
                </div>

                {/* 4 Color Swatches */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.palette.primary }}
                    title={`Primary: ${t.colorNames.primary} (${t.palette.primary})`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.palette.background }}
                    title={`Background: ${t.colorNames.background} (${t.palette.background})`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.palette.darkAccent }}
                    title={`Dark Accent: ${t.colorNames.darkAccent} (${t.palette.darkAccent})`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.palette.highlight }}
                    title={`Highlight: ${t.colorNames.highlight} (${t.palette.highlight})`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Customize visual appearance and theme"
        title={`Active Theme: ${activeTheme.name}`}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
          "border border-[var(--color-border)] hover:border-[var(--color-border-hover)]",
          "bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]",
          "text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1",
          isOpen && "ring-2 ring-[var(--color-focus-ring)]/40 border-[var(--color-primary)]",
          className
        )}
      >
        <div className="relative flex items-center justify-center">
          <Palette className="w-3.5 h-3.5 text-[var(--color-primary)] transition-transform duration-200 group-hover:rotate-12" />
        </div>

        {/* Active Palette Preview Indicator */}
        <div className="hidden sm:flex items-center -space-x-1">
          <span
            className="w-2.5 h-2.5 rounded-full border border-white dark:border-black/50 shadow-2xs"
            style={{ backgroundColor: activeTheme.palette.primary }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-white dark:border-black/50 shadow-2xs"
            style={{ backgroundColor: activeTheme.palette.highlight }}
          />
        </div>

        {showLabel && (
          <span className="hidden md:inline-block text-xs font-semibold text-[var(--color-text)]">
            Theme
          </span>
        )}

        <ChevronDown
          className={cn(
            "w-3 h-3 text-[var(--color-text-muted)] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Theme selector"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text)] leading-none">
                  Visual Appearance
                </h4>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  6 bespoke marble & metallic palettes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              title="Toggle light and dark mode"
            >
              {isDark ? (
                <>
                  <Sun className="w-3 h-3 text-[var(--color-highlight)]" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-[var(--color-primary)]" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>

          {/* Theme Options List */}
          <div className="p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
            {themes.map((t: GlobalTheme) => {
              const isSelected = t.id === globalTheme
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer group",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)] shadow-xs ring-1 ring-[var(--color-primary)]/40"
                      : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]/40"
                  )}
                >
                  {/* Radio / Selection Indicator */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "border-[var(--color-border)] group-hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]"
                    )}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text)] truncate">
                        {t.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                      {t.tagline}
                    </p>

                    {/* Subtle Card / Interface Preview Bar */}
                    <div className="mt-1.5 flex items-center gap-1.5 pt-1.5 border-t border-[var(--color-border)]/50">
                      <span className="text-[9px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Palette:
                      </span>
                      {/* 4 Palette Color Swatches with Exact Hex Values */}
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.palette.primary }}
                          title={`Primary: ${t.colorNames.primary} (${t.palette.primary})`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.palette.background }}
                          title={`Background: ${t.colorNames.background} (${t.palette.background})`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.palette.darkAccent }}
                          title={`Dark Accent: ${t.colorNames.darkAccent} (${t.palette.darkAccent})`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.palette.highlight }}
                          title={`Highlight: ${t.colorNames.highlight} (${t.palette.highlight})`}
                        />
                      </div>

                      {/* Mini UI Card Preview */}
                      <div
                        className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border"
                        style={{
                          backgroundColor: t.palette.background,
                          borderColor: t.palette.highlight,
                          color: t.palette.primary,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: t.palette.primary }}
                        />
                        <span>Card</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
            <span>Instant preview — no reload required</span>
            <span className="font-semibold text-[var(--color-primary)]">
              {activeTheme.shortName}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

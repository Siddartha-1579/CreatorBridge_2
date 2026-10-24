import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { THEMES, THEME_LIST, DEFAULT_THEME_ID, getThemeConfig } from "../config/themes.ts"
import type { ThemeId } from "../types/theme.ts"

/**
 * Calculates relative luminance according to WCAG 2.1 specifications
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "")
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

/**
 * Calculates WCAG contrast ratio between two hex colors
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1)
  const lum2 = getLuminance(hex2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

describe("Global Theme Customization System - Core Registry & Exact Palettes", () => {
  it("registers exactly six distinct themes with numbers 1 through 6", () => {
    assert.equal(THEME_LIST.length, 6)
    const numbers = THEME_LIST.map((t) => t.number).sort((a, b) => a - b)
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6])
  })

  it("verifies Theme 1: Glossy Ruby Red & White Marble exact hex values", () => {
    const t = THEMES["ruby-marble"]
    assert.ok(t, "Theme 1 must exist")
    assert.equal(t.name, "Glossy Ruby Red & White Marble")
    assert.equal(t.palette.primary.toUpperCase(), "#8B0015")
    assert.equal(t.palette.background.toUpperCase(), "#FAF9F6")
    assert.equal(t.palette.darkAccent.toUpperCase(), "#4A0010")
    assert.equal(t.palette.highlight.toUpperCase(), "#C9A46A")
    assert.equal(t.colorNames.primary, "Ruby Marble")
    assert.equal(t.colorNames.background, "Marble White")
    assert.equal(t.colorNames.darkAccent, "Deep Burgundy")
    assert.equal(t.colorNames.highlight, "Champagne Gold")
  })

  it("verifies Theme 2: Glossy Crimson & Pearl Marble exact hex values", () => {
    const t = THEMES["crimson-pearl"]
    assert.ok(t, "Theme 2 must exist")
    assert.equal(t.name, "Glossy Crimson & Pearl Marble")
    assert.equal(t.palette.primary.toUpperCase(), "#B51226")
    assert.equal(t.palette.background.toUpperCase(), "#FFFDF8")
    assert.equal(t.palette.darkAccent.toUpperCase(), "#650018")
    assert.equal(t.palette.highlight.toUpperCase(), "#B76E79")
    assert.equal(t.colorNames.primary, "Crimson Red")
    assert.equal(t.colorNames.background, "Pearl White")
    assert.equal(t.colorNames.darkAccent, "Dark Garnet")
    assert.equal(t.colorNames.highlight, "Rose Gold")
  })

  it("verifies Theme 3: Glossy Scarlet & Ivory Marble exact hex values", () => {
    const t = THEMES["scarlet-ivory"]
    assert.ok(t, "Theme 3 must exist")
    assert.equal(t.name, "Glossy Scarlet & Ivory Marble")
    assert.equal(t.palette.primary.toUpperCase(), "#C1121F")
    assert.equal(t.palette.background.toUpperCase(), "#FFFFF0")
    assert.equal(t.palette.darkAccent.toUpperCase(), "#5C0011")
    assert.equal(t.palette.highlight.toUpperCase(), "#C5A059")
    assert.equal(t.colorNames.primary, "Scarlet Red")
    assert.equal(t.colorNames.background, "Ivory Marble")
    assert.equal(t.colorNames.darkAccent, "Oxblood Red")
    assert.equal(t.colorNames.highlight, "Antique Gold")
  })

  it("verifies Theme 4: Glossy Wine Red & Silver Marble exact hex values", () => {
    const t = THEMES["wine-silver"]
    assert.ok(t, "Theme 4 must exist")
    assert.equal(t.name, "Glossy Wine Red & Silver Marble")
    assert.equal(t.palette.primary.toUpperCase(), "#722F37")
    assert.equal(t.palette.background.toUpperCase(), "#F8FAFC")
    assert.equal(t.palette.darkAccent.toUpperCase(), "#3B0A18")
    assert.equal(t.palette.highlight.toUpperCase(), "#C0C0C0")
    assert.equal(t.colorNames.primary, "Wine Red")
    assert.equal(t.colorNames.background, "Arctic White")
    assert.equal(t.colorNames.darkAccent, "Black Cherry")
    assert.equal(t.colorNames.highlight, "Platinum Silver")
  })

  it("verifies Theme 5: Glossy Cherry Red & Cream Marble exact hex values", () => {
    const t = THEMES["cherry-cream"]
    assert.ok(t, "Theme 5 must exist")
    assert.equal(t.name, "Glossy Cherry Red & Cream Marble")
    assert.equal(t.palette.primary.toUpperCase(), "#A4132C")
    assert.equal(t.palette.background.toUpperCase(), "#FFF8EE")
    assert.equal(t.palette.darkAccent.toUpperCase(), "#4A0E18")
    assert.equal(t.palette.highlight.toUpperCase(), "#B87333")
    assert.equal(t.colorNames.primary, "Cherry Red")
    assert.equal(t.colorNames.background, "Cream White")
    assert.equal(t.colorNames.darkAccent, "Mahogany Burgundy")
    assert.equal(t.colorNames.highlight, "Copper Gold")
  })

  it("verifies Theme 6: Glossy Scarlet Ruby & Rose Marble exact hex values", () => {
    const t = THEMES["scarlet-ruby-rose"]
    assert.ok(t, "Theme 6 must exist")
    assert.equal(t.name, "Glossy Scarlet Ruby & Rose Marble")
    assert.equal(t.palette.primary.toUpperCase(), "#9E1028")
    assert.equal(t.palette.background.toUpperCase(), "#FFFEFA")
    assert.equal(t.palette.darkAccent.toUpperCase(), "#500014")
    assert.equal(t.palette.highlight.toUpperCase(), "#D4A1A8")
    assert.equal(t.colorNames.primary, "Scarlet Ruby")
    assert.equal(t.colorNames.background, "Snow White")
    assert.equal(t.colorNames.darkAccent, "Dark Maroon")
    assert.equal(t.colorNames.highlight, "Soft Rose Gold")
  })
})

describe("Global Theme Customization System - Accessibility & Contrast Validation", () => {
  it("ensures white text on primary buttons meets WCAG AA contrast (>= 4.5:1) for all 6 themes", () => {
    for (const theme of THEME_LIST) {
      const contrast = getContrastRatio("#FFFFFF", theme.palette.primary)
      assert.ok(
        contrast >= 4.5,
        `Theme ${theme.name} primary button contrast ${contrast.toFixed(2)} must be >= 4.5:1`
      )
    }
  })

  it("ensures body text on marble backgrounds meets WCAG AAA contrast (>= 7.0:1) for all 6 themes", () => {
    for (const theme of THEME_LIST) {
      const contrast = getContrastRatio(theme.tokens.text, theme.palette.background)
      assert.ok(
        contrast >= 7.0,
        `Theme ${theme.name} text contrast ${contrast.toFixed(2)} must be >= 7.0:1`
      )
    }
  })

  it("ensures dark mode background and text have high contrast (>= 7.0:1)", () => {
    for (const theme of THEME_LIST) {
      const contrast = getContrastRatio(theme.tokens.darkText, theme.tokens.darkBackground)
      assert.ok(
        contrast >= 7.0,
        `Theme ${theme.name} dark mode text contrast ${contrast.toFixed(2)} must be >= 7.0:1`
      )
    }
  })
})

describe("Global Theme Customization System - Fallbacks & Safety", () => {
  it("defaults to Theme 1 (ruby-marble) for first-time visitors", () => {
    assert.equal(DEFAULT_THEME_ID, "ruby-marble")
    const theme = getThemeConfig(null)
    assert.equal(theme.id, "ruby-marble")
    assert.equal(theme.name, "Glossy Ruby Red & White Marble")
  })

  it("safely handles undefined, empty, or invalid theme IDs by falling back to default", () => {
    assert.equal(getThemeConfig(undefined).id, "ruby-marble")
    assert.equal(getThemeConfig("").id, "ruby-marble")
    assert.equal(getThemeConfig("invalid_nonexistent_theme").id, "ruby-marble")
    assert.equal(getThemeConfig("cyberpunk-neon").id, "ruby-marble")
  })

  it("retrieves valid theme IDs accurately", () => {
    const validIds: ThemeId[] = [
      "ruby-marble",
      "crimson-pearl",
      "scarlet-ivory",
      "wine-silver",
      "cherry-cream",
      "scarlet-ruby-rose",
    ]

    for (const id of validIds) {
      const theme = getThemeConfig(id)
      assert.equal(theme.id, id)
    }
  })
})

export type ThemeId =
  | "ruby-marble"
  | "crimson-pearl"
  | "scarlet-ivory"
  | "wine-silver"
  | "cherry-cream"
  | "scarlet-ruby-rose"
  | "classic-purple"

export interface ThemePalette {
  /** Primary brand / button color */
  primary: string
  /** Main application background color */
  background: string
  /** Dark contrast shade for typography, emphasis, deep surfaces */
  darkAccent: string
  /** Metallic/luxury highlight color for accents, rings, badges */
  highlight: string
}

export interface ThemeColorNames {
  primary: string
  background: string
  darkAccent: string
  highlight: string
}

export interface DerivedTokens {
  primaryHover: string
  primaryForeground: string
  surface: string
  surfaceElevated: string
  surfaceMuted: string
  text: string
  textMuted: string
  border: string
  borderHover: string
  focusRing: string
  accent: string
  success: string
  warning: string
  error: string
  // Dark mode counterpart tokens
  darkBackground: string
  darkSurface: string
  darkSurfaceElevated: string
  darkSurfaceMuted: string
  darkText: string
  darkTextMuted: string
  darkBorder: string
  darkPrimary: string
  darkPrimaryHover: string
  darkHighlight: string
}

export interface GlobalTheme {
  id: ThemeId
  number: number
  name: string
  shortName: string
  tagline: string
  visualIdentity: string
  palette: ThemePalette
  colorNames: ThemeColorNames
  tokens: DerivedTokens
}

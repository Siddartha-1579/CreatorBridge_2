import type { GlobalTheme, ThemeId } from "../types/theme"

export const THEME_STORAGE_KEY = "creatorbridge_global_theme_id"
export const DEFAULT_THEME_ID: ThemeId = "ruby-marble"

export const THEMES: Record<ThemeId, GlobalTheme> = {
  "ruby-marble": {
    id: "ruby-marble",
    number: 1,
    name: "Glossy Ruby Red & White Marble",
    shortName: "Ruby & White Marble",
    tagline: "Bold, luxurious, and professional",
    visualIdentity: "premium, bold, luxurious, and professional.",
    palette: {
      primary: "#8B0015",     // Ruby Marble
      background: "#FAF9F6",  // Marble White
      darkAccent: "#4A0010",  // Deep Burgundy
      highlight: "#C9A46A",   // Champagne Gold
    },
    colorNames: {
      primary: "Ruby Marble",
      background: "Marble White",
      darkAccent: "Deep Burgundy",
      highlight: "Champagne Gold",
    },
    tokens: {
      primaryHover: "#6D0010",
      primaryForeground: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceElevated: "#FAF9F6",
      surfaceMuted: "#F4EEE8",
      text: "#1D0B10",
      textMuted: "#5E454B",
      border: "#EADCDF",
      borderHover: "#C9A46A",
      focusRing: "#8B0015",
      accent: "#C9A46A",
      success: "#15803D",
      warning: "#B45309",
      error: "#DC2626",
      darkBackground: "#140508",
      darkSurface: "#20090F",
      darkSurfaceElevated: "#2D0E16",
      darkSurfaceMuted: "#3A141D",
      darkText: "#FBF5F6",
      darkTextMuted: "#D2B8BE",
      darkBorder: "#4A1823",
      darkPrimary: "#B82236",
      darkPrimaryHover: "#D23348",
      darkHighlight: "#E2BF88",
    },
  },

  "crimson-pearl": {
    id: "crimson-pearl",
    number: 2,
    name: "Glossy Crimson & Pearl Marble",
    shortName: "Crimson & Pearl Marble",
    tagline: "Modern, creator-focused, and sophisticated",
    visualIdentity: "modern, elegant, creator-focused, and sophisticated.",
    palette: {
      primary: "#B51226",     // Crimson Red
      background: "#FFFDF8",  // Pearl White
      darkAccent: "#650018",  // Dark Garnet
      highlight: "#B76E79",   // Rose Gold
    },
    colorNames: {
      primary: "Crimson Red",
      background: "Pearl White",
      darkAccent: "Dark Garnet",
      highlight: "Rose Gold",
    },
    tokens: {
      primaryHover: "#930D1E",
      primaryForeground: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFDF8",
      surfaceMuted: "#F7F2EC",
      text: "#1F0A0F",
      textMuted: "#61454D",
      border: "#ECDDDF",
      borderHover: "#B76E79",
      focusRing: "#B51226",
      accent: "#B76E79",
      success: "#15803D",
      warning: "#B45309",
      error: "#DC2626",
      darkBackground: "#150509",
      darkSurface: "#210A10",
      darkSurfaceElevated: "#2E1018",
      darkSurfaceMuted: "#3D1621",
      darkText: "#FCF6F7",
      darkTextMuted: "#D3B9BF",
      darkBorder: "#4F1B26",
      darkPrimary: "#D5263D",
      darkPrimaryHover: "#E93B53",
      darkHighlight: "#D48F9A",
    },
  },

  "scarlet-ivory": {
    id: "scarlet-ivory",
    number: 3,
    name: "Glossy Scarlet & Ivory Marble",
    shortName: "Scarlet & Ivory Marble",
    tagline: "Confident, editorial, and premium",
    visualIdentity: "confident, editorial, and premium.",
    palette: {
      primary: "#C1121F",     // Scarlet Red
      background: "#FFFFF0",  // Ivory Marble
      darkAccent: "#5C0011",  // Oxblood Red
      highlight: "#C5A059",   // Antique Gold
    },
    colorNames: {
      primary: "Scarlet Red",
      background: "Ivory Marble",
      darkAccent: "Oxblood Red",
      highlight: "Antique Gold",
    },
    tokens: {
      primaryHover: "#9C0C17",
      primaryForeground: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFF0",
      surfaceMuted: "#F7F5E4",
      text: "#1E0B0F",
      textMuted: "#60474C",
      border: "#EBE5D3",
      borderHover: "#C5A059",
      focusRing: "#C1121F",
      accent: "#C5A059",
      success: "#15803D",
      warning: "#B45309",
      error: "#DC2626",
      darkBackground: "#16060A",
      darkSurface: "#230C12",
      darkSurfaceElevated: "#31121A",
      darkSurfaceMuted: "#3F1822",
      darkText: "#FAF8F1",
      darkTextMuted: "#D5C9B3",
      darkBorder: "#4F2128",
      darkPrimary: "#DD2331",
      darkPrimaryHover: "#F23846",
      darkHighlight: "#DFBA74",
    },
  },

  "wine-silver": {
    id: "wine-silver",
    number: 4,
    name: "Glossy Wine Red & Silver Marble",
    shortName: "Wine & Silver Marble",
    tagline: "Restrained, enterprise-ready, and refined",
    visualIdentity: "restrained, enterprise-ready, and refined.",
    palette: {
      primary: "#722F37",     // Wine Red
      background: "#F8FAFC",  // Arctic White
      darkAccent: "#3B0A18",  // Black Cherry
      highlight: "#C0C0C0",   // Platinum Silver
    },
    colorNames: {
      primary: "Wine Red",
      background: "Arctic White",
      darkAccent: "Black Cherry",
      highlight: "Platinum Silver",
    },
    tokens: {
      primaryHover: "#5A232A",
      primaryForeground: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceElevated: "#F8FAFC",
      surfaceMuted: "#EDF2F7",
      text: "#181417",
      textMuted: "#53484C",
      border: "#E2E5EA",
      borderHover: "#C0C0C0",
      focusRing: "#722F37",
      accent: "#C0C0C0",
      success: "#15803D",
      warning: "#B45309",
      error: "#DC2626",
      darkBackground: "#0F0B0E",
      darkSurface: "#1B1319",
      darkSurfaceElevated: "#251C24",
      darkSurfaceMuted: "#312630",
      darkText: "#F7F8FA",
      darkTextMuted: "#C7CBD2",
      darkBorder: "#3D2C3A",
      darkPrimary: "#98444E",
      darkPrimaryHover: "#AF5560",
      darkHighlight: "#D8D8D8",
    },
  },

  "cherry-cream": {
    id: "cherry-cream",
    number: 5,
    name: "Glossy Cherry Red & Cream Marble",
    shortName: "Cherry & Cream Marble",
    tagline: "Warm, expressive, and approachable",
    visualIdentity: "warm, expressive, creative, and approachable.",
    palette: {
      primary: "#A4132C",     // Cherry Red
      background: "#FFF8EE",  // Cream White
      darkAccent: "#4A0E18",  // Mahogany Burgundy
      highlight: "#B87333",   // Copper Gold
    },
    colorNames: {
      primary: "Cherry Red",
      background: "Cream White",
      darkAccent: "Mahogany Burgundy",
      highlight: "Copper Gold",
    },
    tokens: {
      primaryHover: "#840D21",
      primaryForeground: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceElevated: "#FFF8EE",
      surfaceMuted: "#F7EDE0",
      text: "#210C11",
      textMuted: "#63474C",
      border: "#E9DACD",
      borderHover: "#B87333",
      focusRing: "#A4132C",
      accent: "#B87333",
      success: "#15803D",
      warning: "#B45309",
      error: "#DC2626",
      darkBackground: "#16070B",
      darkSurface: "#240E14",
      darkSurfaceElevated: "#33151D",
      darkSurfaceMuted: "#421C27",
      darkText: "#FCF8F4",
      darkTextMuted: "#D7C5BC",
      darkBorder: "#51242E",
      darkPrimary: "#C62542",
      darkPrimaryHover: "#DE3957",
      darkHighlight: "#D48D4D",
    },
  },

  "scarlet-ruby-rose": {
    id: "scarlet-ruby-rose",
    number: 6,
    name: "Glossy Scarlet Ruby & Rose Marble",
    shortName: "Scarlet Ruby & Rose Marble",
    tagline: "Contemporary, artistic, and visually distinctive",
    visualIdentity: "contemporary, artistic, elegant, and visually distinctive.",
    palette: {
      primary: "#9E1028",     // Scarlet Ruby
      background: "#FFFEFA",  // Snow White
      darkAccent: "#500014",  // Dark Maroon
      highlight: "#D4A1A8",   // Soft Rose Gold
    },
    colorNames: {
      primary: "Scarlet Ruby",
      background: "Snow White",
      darkAccent: "Dark Maroon",
      highlight: "Soft Rose Gold",
    },
    tokens: {
      primaryHover: "#7D0A1E",
      primaryForeground: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFEFA",
      surfaceMuted: "#F8F1EE",
      text: "#1D0B10",
      textMuted: "#60464B",
      border: "#E9DDDB",
      borderHover: "#D4A1A8",
      focusRing: "#9E1028",
      accent: "#D4A1A8",
      success: "#15803D",
      warning: "#B45309",
      error: "#DC2626",
      darkBackground: "#15050A",
      darkSurface: "#220912",
      darkSurfaceElevated: "#300E1A",
      darkSurfaceMuted: "#3F1423",
      darkText: "#FDF8F9",
      darkTextMuted: "#DABBC1",
      darkBorder: "#4D1B28",
      darkPrimary: "#BE1D37",
      darkPrimaryHover: "#D7304C",
      darkHighlight: "#E6B7BE",
    },
  },
}

export const THEME_LIST = Object.values(THEMES)

export function getThemeConfig(id?: string | null): GlobalTheme {
  if (id && id in THEMES) {
    return THEMES[id as ThemeId]
  }
  return THEMES[DEFAULT_THEME_ID]
}

// Floria Delivery Mobile — Canonical Visual Theme Tokens (DESIGN.md)
export const theme = {
  colors: {
    forest: "#1E3A2B", // Deep Botanical Forest Green
    terracotta: "#943828", // Warm Earth Terracotta Accent / CTA
    sage: "#4A5D4E", // Olive Sage
    botanicalGreen: "#DDE7DD", // Soft Green Pill / Badge Background
    botanicalGreenText: "#1E3A2B",
    cream: "#F9F8F3", // Canonical Floria Page Background (Warm Cream)
    linen: "#FBF8F1", // Elevated Card Surface (Linen)
    sand: "#F6F1E7", // Soft Sand Section Background
    inputSand: "#EFE8DC", // Input Fill Sand
    divider: "#E2D9CC", // Divider Linen Line
    charcoal: "#212529", // Primary Editorial Charcoal Text
    muted: "#6C756F", // Secondary / Note Muted Gray-Green
    white: "#FFFFFF",
    success: "#2B6E3F",
    warning: "#B5651D",
    error: "#943828",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: "#212529",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: "#212529",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: "#212529",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  typography: {
    fontFamilies: {
      display: "CormorantGaramond",
      serif: "CormorantGaramond",
      sans: "Inter",
      body: "Inter",
      ui: "Inter",
    },
    title: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#1E3A2B",
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      color: "#6C756F",
      lineHeight: 18,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700" as const,
      color: "#6C756F",
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
    },
    body: {
      fontSize: 14,
      color: "#212529",
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      color: "#6C756F",
      lineHeight: 16,
    },
    button: {
      fontSize: 13,
      fontWeight: "700" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
  },
} as const;

export type Theme = typeof theme;

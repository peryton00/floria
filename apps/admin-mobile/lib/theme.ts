// Floria — Design Tokens & Theme for Admin Mobile

export const Colors = {
  // Core Brand
  forest: "#1E3A2B",
  forestLight: "#2C5235",
  forestDark: "#12241B",
  terracotta: "#943828",
  terracottaLight: "#DE7260",
  terracottaDark: "#7D2E20",
  sage: "#4A5D4E",
  sageLight: "#9EB5A0",
  botanical: "#DDE7DD",

  // Surfaces & Backgrounds
  page: "#F9F8F3",
  linen: "#FBF8F1",
  softSand: "#F6F1E7",
  sand: "#EFE8DC",
  naturalSand: "#E9E1D3",
  border: "#E2D9CC",

  // Typography & Neutrals
  ink: "#212529",
  inkLight: "#495057",
  inkMuted: "#6C756F",
  inkSubtle: "#ADB5BD",
  white: "#FFFFFF",

  // Semantic Status
  success: "#15803D",
  successBg: "#F0FDF4",
  warning: "#B45309",
  warningBg: "#FEF3C7",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  info: "#1D4ED8",
  infoBg: "#EFF6FF",
} as const;

export const Fonts = {
  display: {
    regular: "CormorantGaramond_400Regular",
    medium: "CormorantGaramond_500Medium",
    semiBold: "CormorantGaramond_600SemiBold",
    italic: "CormorantGaramond_400Regular_Italic",
  },
  sans: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  script: {
    regular: "CormorantGaramond_400Regular_Italic",
  },
} as const;

export const Typography = {
  fontFamilies: {
    display: Fonts.display.semiBold,
    serif: Fonts.display.semiBold,
    displayRegular: Fonts.display.regular,
    displayMedium: Fonts.display.medium,
    displaySemiBold: Fonts.display.semiBold,
    sans: Fonts.sans.regular,
    sansMedium: Fonts.sans.medium,
    sansSemiBold: Fonts.sans.semiBold,
    sansBold: Fonts.sans.bold,
    body: Fonts.sans.regular,
    ui: Fonts.sans.medium,
    script: Fonts.script.regular,
  },
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
  },
  lineHeights: {
    xs: 15,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 38,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

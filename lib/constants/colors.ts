// Qred Brand Color System - "Modern Trust" Palette (Enhanced)
// Based on the 60-30-10 rule for optimal financial app design
// Inspired by modern fintech apps with trust and innovation

export const QredColors = {
  // 60% Primary (Backgrounds) - Clean and spacious
  background: {
    light: "#FFFFFF",
    dark: "#0A0E1A",
    surface: "#F8FAFB",
    muted: "#F3F5F7",
    elevated: "#FAFBFC",
  },

  // 30% Secondary (Cards, Headers, Nav) - Qred Navy (Enhanced)
  brand: {
    navy: "#1A2A4D",
    navyLight: "#2A3A5D",
    navyDark: "#0F1A35",
    navyMuted: "#E8EBF0",
    surface: "#F0F3F8",
    surfaceDark: "#1E2A47",
    gradient: "linear-gradient(135deg, #1A2A4D 0%, #2A3A5D 100%)",
  },

  // 10% Accent (Buttons, Links, Active States) - Success Green (Enhanced)
  accent: {
    green: "#00E676",
    greenLight: "#4AFF9A",
    greenDark: "#00C853",
    greenMuted: "#E8FFF3",
    greenSurface: "#F0FFF7",
    gradient: "linear-gradient(135deg, #00E676 0%, #00C853 100%)",
  },

  // Status Colors aligned with brand (Enhanced)
  status: {
    success: {
      50: "#E8FFF3",
      100: "#C8F5DC",
      200: "#9EEDC0",
      500: "#00E676",
      600: "#00C853",
      700: "#00A844",
      800: "#00962F",
      900: "#007A25",
    },
    error: {
      50: "#FFF1F0",
      100: "#FFE1DE",
      200: "#FFC7C2",
      500: "#FF4D4F",
      600: "#F5222D",
      700: "#CF1322",
      800: "#A8071A",
      900: "#820014",
    },
    warning: {
      50: "#FFF7E6",
      100: "#FFE7BA",
      200: "#FFD591",
      500: "#FFA940",
      600: "#FA8C16",
      700: "#D46B08",
      800: "#AD4E00",
      900: "#873800",
    },
    info: {
      50: "#E6F7FF",
      100: "#BAE7FF",
      200: "#91D5FF",
      500: "#40A9FF",
      600: "#1890FF",
      700: "#096DD9",
      800: "#0050B3",
      900: "#003A8C",
    },
  },

  // Typography aligned with brand (Enhanced)
  text: {
    primary: "#0A0E1A", // Deep black for maximum readability
    secondary: "#3E4C59", // Muted dark for body text
    tertiary: "#6B7785", // Medium gray for supporting text
    quaternary: "#9BA5B1", // Light gray for hints
    disabled: "#C4CDD5", // Very light gray for disabled text
    inverse: "#FFFFFF", // White text on dark backgrounds
    brand: "#1A2A4D", // Brand navy for emphasis
    accent: "#00E676", // Accent green for highlights
  },

  // Functional colors (Enhanced)
  border: {
    light: "#E8ECF0",
    medium: "#D1D8DD",
    dark: "#9BA5B1",
    brand: "#1A2A4D",
    accent: "#00E676",
    subtle: "#F3F5F7",
  },

  // Card and surface colors (Enhanced)
  surface: {
    elevated: "#FFFFFF",
    card: "#FAFBFC",
    overlay: "rgba(26, 42, 77, 0.85)",
    overlayLight: "rgba(26, 42, 77, 0.05)",
    shadow: "rgba(10, 14, 26, 0.08)",
    shadowMedium: "rgba(10, 14, 26, 0.12)",
    shadowHeavy: "rgba(10, 14, 26, 0.16)",
  },

  // Gradient definitions (Enhanced)
  gradients: {
    brandPrimary: "linear-gradient(135deg, #1A2A4D 0%, #2A3A5D 100%)",
    brandSubtle: "linear-gradient(180deg, #F0F3F8 0%, #FAFBFC 100%)",
    accent: "linear-gradient(135deg, #00E676 0%, #00C853 100%)",
    accentSubtle: "linear-gradient(180deg, #E8FFF3 0%, #F0FFF7 100%)",
    surface: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFB 100%)",
    overlay: "linear-gradient(180deg, rgba(26, 42, 77, 0) 0%, rgba(26, 42, 77, 0.8) 100%)",
  },
}

// Utility function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace("#", "")
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Semantic color mappings for components (Enhanced)
export const SemanticColors = {
  // Primary actions (buttons, links)
  primary: QredColors.accent.green,
  primaryHover: QredColors.accent.greenDark,
  primarySurface: QredColors.accent.greenMuted,
  primaryGradient: QredColors.gradients.accent,

  // Secondary actions
  secondary: QredColors.brand.navy,
  secondaryHover: QredColors.brand.navyLight,
  secondarySurface: QredColors.brand.navyMuted,
  secondaryGradient: QredColors.gradients.brandPrimary,

  // Debt/money related colors
  lending: QredColors.status.success[600], // Money you're owed
  lendingSurface: QredColors.status.success[50],
  borrowing: QredColors.status.warning[600], // Money you owe
  borrowingSurface: QredColors.status.warning[50],
  paid: QredColors.status.success[700], // Completed payments
  paidSurface: QredColors.status.success[100],
  overdue: QredColors.status.error[600], // Overdue debts
  overdueSurface: QredColors.status.error[50],
  pending: QredColors.status.info[600], // Pending debts
  pendingSurface: QredColors.status.info[50],

  // Interactive states
  hover: withOpacity(QredColors.brand.navy, 0.08),
  pressed: withOpacity(QredColors.brand.navy, 0.12),
  focus: QredColors.accent.green,
  disabled: QredColors.text.disabled,
  selected: QredColors.accent.greenMuted,
}

// Shadow definitions following brand guidelines (Enhanced)
export const Shadows = {
  xs: "0px 1px 2px rgba(10, 14, 26, 0.05)",
  sm: "0px 2px 4px rgba(10, 14, 26, 0.06), 0px 1px 2px rgba(10, 14, 26, 0.04)",
  md: "0px 4px 8px rgba(10, 14, 26, 0.08), 0px 2px 4px rgba(10, 14, 26, 0.06)",
  lg: "0px 8px 16px rgba(10, 14, 26, 0.10), 0px 4px 8px rgba(10, 14, 26, 0.08)",
  xl: "0px 12px 24px rgba(10, 14, 26, 0.12), 0px 6px 12px rgba(10, 14, 26, 0.10)",
  "2xl": "0px 16px 32px rgba(10, 14, 26, 0.14), 0px 8px 16px rgba(10, 14, 26, 0.12)",
  card: "0px 2px 8px rgba(26, 42, 77, 0.06)",
  elevated: "0px 4px 16px rgba(26, 42, 77, 0.10)",
  fab: "0px 8px 24px rgba(26, 42, 77, 0.14)",
  overlay: "0px 12px 32px rgba(26, 42, 77, 0.18)",
}

// Spacing scale (8px base)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
}

// Border radius scale
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
}

// Export default color scheme for easy access
export default QredColors

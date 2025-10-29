// Qred Brand Color System - "Modern Trust" Palette
// Based on the 60-30-10 rule for optimal financial app design

export const QredColors = {
  // 60% Primary (Backgrounds)
  background: {
    light: '#FFFFFF',
    dark: '#121212',
    surface: '#F8F9FA',
    muted: '#F5F5F7',
  },

  // 30% Secondary (Cards, Headers, Nav) - Qred Navy
  brand: {
    navy: '#1A2A4D',
    navyLight: '#2A3A5D',
    navyDark: '#0A1A3D',
    surface: '#F0F2F8',
    surfaceDark: '#1E2A47',
  },

  // 10% Accent (Buttons, Links, Active States) - Success Green
  accent: {
    green: '#00E676',
    greenLight: '#4AFF9A',
    greenDark: '#00C853',
    greenSurface: '#E8F5E8',
  },

  // Status Colors aligned with brand
  status: {
    success: {
      50: '#E8F5E8',
      100: '#C8E6C9',
      500: '#00E676',
      600: '#00C853',
      700: '#00A844',
      800: '#00962F',
    },
    error: {
      50: '#FFEBEE',
      100: '#FFCDD2',
      500: '#F44336',
      600: '#E53935',
      700: '#D32F2F',
      800: '#C62828',
    },
    warning: {
      50: '#FFF8E1',
      100: '#FFECB3',
      500: '#FFC107',
      600: '#FFB300',
      700: '#FFA000',
      800: '#FF8F00',
    },
    info: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
    },
  },

  // Typography aligned with brand
  text: {
    primary: '#1A2A4D',     // Brand navy for headings
    secondary: '#333333',    // Dark gray for body text
    tertiary: '#666666',     // Medium gray for supporting text
    disabled: '#999999',     // Light gray for disabled text
    inverse: '#FFFFFF',      // White text on dark backgrounds
    light: '#E0E0E0',       // Light text for dark mode
  },

  // Functional colors
  border: {
    light: '#E0E0E0',
    medium: '#CCCCCC',
    dark: '#999999',
    brand: '#1A2A4D',
    accent: '#00E676',
  },

  // Card and surface colors
  surface: {
    elevated: '#FFFFFF',
    card: '#F8F9FA',
    overlay: 'rgba(26, 42, 77, 0.8)', // Brand navy with opacity
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  // Gradient definitions
  gradients: {
    brandPrimary: 'linear-gradient(135deg, #1A2A4D 0%, #2A3A5D 100%)',
    accent: 'linear-gradient(135deg, #00E676 0%, #4AFF9A 100%)',
    surface: 'linear-gradient(180deg, #F8F9FA 0%, #F0F2F8 100%)',
  },
};

// Utility function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Semantic color mappings for components
export const SemanticColors = {
  // Primary actions (buttons, links)
  primary: QredColors.accent.green,
  primaryHover: QredColors.accent.greenDark,
  primarySurface: QredColors.accent.greenSurface,

  // Secondary actions
  secondary: QredColors.brand.navy,
  secondaryHover: QredColors.brand.navyLight,
  secondarySurface: QredColors.brand.surface,

  // Debt/money related colors
  lending: QredColors.status.success[600], // Money you're owed
  borrowing: QredColors.status.warning[600], // Money you owe
  paid: QredColors.status.success[700], // Completed payments
  overdue: QredColors.status.error[600], // Overdue debts

  // Interactive states
  hover: withOpacity(QredColors.brand.navy, 0.1),
  pressed: withOpacity(QredColors.brand.navy, 0.2),
  focus: QredColors.accent.green,
  disabled: QredColors.text.disabled,
};

// Shadow definitions following brand guidelines
export const Shadows = {
  card: '0px 2px 8px rgba(26, 42, 77, 0.08)',
  elevated: '0px 4px 16px rgba(26, 42, 77, 0.12)',
  fab: '0px 8px 24px rgba(26, 42, 77, 0.16)',
  overlay: '0px 12px 32px rgba(26, 42, 77, 0.20)',
};

// Export default color scheme for easy access
export default QredColors;

// E-Ride Theme Configuration - Exact match with His-eride
export const Colors = {
  light: {
    // Brand colors - exact match
    brand: {
      primary: '#2d1d0c', // E-Ride primary black
      secondary: '#fcd424', // E-Ride yellow highlights
      accent: '#fcd424', // Yellow accent
    },
    // UI colors
    ui: {
      main: '#2d1d0c',
      accent: '#fcd424',
    },
    // Standard colors
    text: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    border: '#E5E7EB',
    error: '#EF4444',
    errorBackground: '#FEF2F2',
    success: '#10B981',
    successBackground: '#F0FDF4',
    warning: '#F59E0B',
    info: '#3B82F6',
    // Gradients
    gradient: {
      primary: 'linear-gradient(135deg, #2d1d0c 0%, #1a1a1a 100%)',
      secondary: 'linear-gradient(135deg, #1a1a1a 0%, #2d1d0c 100%)',
      splash: 'linear-gradient(135deg, #1a1a1a 0%, #2d1d0c 100%)',
    },
    tint: '#fcd424',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#fcd424',
  },
  dark: {
    // Brand colors - same as light for consistency
    brand: {
      primary: '#2d1d0c',
      secondary: '#fcd424',
      accent: '#fcd424',
    },
    // UI colors
    ui: {
      main: '#2d1d0c',
      accent: '#fcd424',
    },
    // Dark mode colors
    text: '#FFFFFF',
    textSecondary: '#D1D5DB',
    textLight: '#9CA3AF',
    background: '#111827',
    backgroundSecondary: '#1F2937',
    border: '#374151',
    error: '#F87171',
    errorBackground: '#1F1B1B',
    success: '#34D399',
    successBackground: '#1B1F1B',
    warning: '#FBBF24',
    info: '#60A5FA',
    // Gradients
    gradient: {
      primary: 'linear-gradient(135deg, #2d1d0c 0%, #1a1a1a 100%)',
      secondary: 'linear-gradient(135deg, #1a1a1a 0%, #2d1d0c 100%)',
      splash: 'linear-gradient(135deg, #1a1a1a 0%, #2d1d0c 100%)',
    },
    tint: '#fcd424',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#fcd424',
  },
};

// Typography - using Montserrat like the original
export const Typography = {
  fontFamily: {
    regular: 'Montserrat',
    bold: 'Montserrat-Bold',
    semibold: 'Montserrat-SemiBold',
    medium: 'Montserrat-Medium',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
};

// Common styles for buttons, inputs, etc.
export const ComponentStyles = {
  button: {
    primary: {
      backgroundColor: Colors.light.brand.secondary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.light.brand.secondary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
    },
  },
  input: {
    base: {
      borderWidth: 1,
      borderColor: Colors.light.border,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
    },
    focused: {
      borderColor: Colors.light.brand.secondary,
    },
    error: {
      borderColor: Colors.light.error,
    },
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
};

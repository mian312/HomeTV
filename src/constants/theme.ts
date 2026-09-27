/**
 * HomeTV Design System — centralized theme tokens.
 *
 * Every visual value in the app should come from this file. Components
 * consume tokens rather than scattering literal colors, sizes, or
 * shadow values through screens.
 *
 * Existing tokens (Colors, Fonts, Spacing) are preserved and extended.
 * New token groups: Typography, Radius, Elevation, Motion.
 */

import '@/global.css';

import { Platform, TextStyle, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Colors — semantic, scheme-aware palette
// ---------------------------------------------------------------------------

export const Colors = {
  light: {
    // Core
    text: '#11181C',
    textSecondary: '#687076',
    textTertiary: '#889096',
    textInverse: '#FFFFFF',

    // Backgrounds
    background: '#FFFFFF',
    backgroundElement: '#F1F3F5',
    backgroundSelected: '#E6E8EB',
    backgroundElevated: '#FFFFFF',

    // Primary / accent
    primary: '#0091FF',
    primaryText: '#FFFFFF',
    primaryMuted: '#E1F0FF',

    // Surfaces & cards
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',
    surfaceTertiary: '#F1F3F5',

    // Borders & separators
    border: '#E6E8EB',
    borderMuted: '#F1F3F5',

    // Semantic states
    success: '#30A46C',
    successMuted: '#DDF3E4',
    warning: '#F5A623',
    warningMuted: '#FFF4E0',
    error: '#E5484D',
    errorMuted: '#FFE5E5',

    // Overlays / scrims
    overlay: 'rgba(0, 0, 0, 0.4)',
    scrim: 'rgba(0, 0, 0, 0.6)',

    // Player
    playerBackground: '#000000',
    playerText: '#FFFFFF',
    playerControl: 'rgba(255, 255, 255, 0.9)',
    playerControlMuted: 'rgba(255, 255, 255, 0.5)',

    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#0091FF',
    tabBarInactive: '#889096',

    // Icons
    icon: '#11181C',
    iconSecondary: '#687076',
  },
  dark: {
    // Core
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textTertiary: '#687076',
    textInverse: '#11181C',

    // Backgrounds
    background: '#0A0A0B',
    backgroundElement: '#1A1B1E',
    backgroundSelected: '#262729',
    backgroundElevated: '#1A1B1E',

    // Primary / accent
    primary: '#3B9EFF',
    primaryText: '#FFFFFF',
    primaryMuted: '#0D2847',

    // Surfaces & cards
    surface: '#141416',
    surfaceSecondary: '#1A1B1E',
    surfaceTertiary: '#222326',

    // Borders & separators
    border: '#2E3035',
    borderMuted: '#222326',

    // Semantic states
    success: '#3DD68C',
    successMuted: '#0B2E1A',
    warning: '#F5A623',
    warningMuted: '#2E1F00',
    error: '#FF6369',
    errorMuted: '#3C1618',

    // Overlays / scrims
    overlay: 'rgba(0, 0, 0, 0.6)',
    scrim: 'rgba(0, 0, 0, 0.8)',

    // Player
    playerBackground: '#000000',
    playerText: '#FFFFFF',
    playerControl: 'rgba(255, 255, 255, 0.9)',
    playerControlMuted: 'rgba(255, 255, 255, 0.4)',

    // Tab bar
    tabBarBackground: '#0A0A0B',
    tabBarActive: '#3B9EFF',
    tabBarInactive: '#687076',

    // Icons
    icon: '#ECEDEE',
    iconSecondary: '#9BA1A6',
  },
} as const;

/**
 * Union of all semantic color keys. Both palettes share the same keys.
 */
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ---------------------------------------------------------------------------
// Fonts — platform-specific font families (preserved from starter)
// ---------------------------------------------------------------------------

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// ---------------------------------------------------------------------------
// Spacing — consistent spacing scale (preserved and extended)
// ---------------------------------------------------------------------------

export const Spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 48px */
  huge: 48,
  /** 64px */
  massive: 64,

  // Legacy aliases — avoid in new code, use semantic names above
  /** @deprecated Use `xxs` */ half: 2,
  /** @deprecated Use `xs` */ one: 4,
  /** @deprecated Use `sm` */ two: 8,
  /** @deprecated Use `lg` */ three: 16,
  /** @deprecated Use `xxl` */ four: 24,
  /** @deprecated Use `xxxl` */ five: 32,
  /** @deprecated Use `massive` */ six: 64,
} as const;

// ---------------------------------------------------------------------------
// Typography — named text presets
// ---------------------------------------------------------------------------

export const Typography = {
  /** Large hero/display headings. */
  displayLarge: {
    fontFamily: Fonts.sans,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  /** Screen titles. */
  displaySmall: {
    fontFamily: Fonts.sans,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  /** Section/card headings. */
  headlineLarge: {
    fontFamily: Fonts.sans,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  /** Sub-section headings. */
  headlineSmall: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  /** Channel names, list item titles. */
  titleLarge: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  /** Card subtitles, metadata labels. */
  titleSmall: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  /** Default body text. */
  body: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  /** Slightly smaller body/descriptive text. */
  bodySmall: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  /** Captions, timestamps, badges. */
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },
  /** Tiny labels, badge counts. */
  overline: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  /** Code snippets, monospaced content. */
  code: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  /** Button text. */
  button: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },
  /** Tab bar labels. */
  tabLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

// ---------------------------------------------------------------------------
// Border Radius — consistent corner radii
// ---------------------------------------------------------------------------

export const Radius = {
  /** 0 — sharp corners */
  none: 0,
  /** 4px — subtle rounding (badges, chips) */
  xs: 4,
  /** 8px — cards, inputs */
  sm: 8,
  /** 12px — elevated cards, modals */
  md: 12,
  /** 16px — large cards, bottom sheets */
  lg: 16,
  /** 24px — pills, rounded buttons */
  xl: 24,
  /** 9999 — fully circular */
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Elevation — cross-platform shadow presets
// ---------------------------------------------------------------------------

interface ElevationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const Elevation: Record<string, ViewStyle> = {
  /** No shadow. */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Subtle lift — cards. */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  /** Medium lift — dropdowns, popovers. */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  /** High lift — FABs, modals. */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Highest — bottom sheets, full overlays. */
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const satisfies Record<string, ElevationStyle>;

// ---------------------------------------------------------------------------
// Motion — animation timing presets
// ---------------------------------------------------------------------------

export const Motion = {
  /** Quick micro-interactions (press feedback, toggles). */
  fast: {
    duration: 150,
    // Native Easing values used with Animated/Reanimated
  },
  /** Standard transitions (page elements, cards). */
  normal: {
    duration: 250,
  },
  /** Slower, cinematic transitions (modals, sheets). */
  slow: {
    duration: 400,
  },
  /** Spring config for bouncy interactions. */
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  /** Spring config for snappy interactions. */
  springTight: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
} as const;

// ---------------------------------------------------------------------------
// Layout constants (preserved from starter)
// ---------------------------------------------------------------------------

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Minimum comfortable touch target (48×48 dp per accessibility guidelines).
 */
export const MinTouchTarget = 48;

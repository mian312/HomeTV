/**
 * Hook for accessing the resolved theme and design tokens.
 *
 * Returns the full design system for the current scheme — colors, typography,
 * spacing, radius, elevation, and motion — so components never need to import
 * tokens directly or hard-code visual values.
 *
 * Usage:
 *   const { colors, typography, spacing, radius, elevation, motion } = useTheme();
 *   <Text style={[typography.body, { color: colors.text }]}>Hello</Text>
 */

import { Colors, Elevation, Motion, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/stores/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResolvedScheme = 'light' | 'dark';

/** Widened color type compatible with both light and dark palettes. */
export type ThemeColors = {
  readonly [K in keyof (typeof Colors)['light']]: string;
};

export interface ThemeResult {
  /** The resolved color palette for the current scheme. */
  colors: ThemeColors;
  /** The resolved scheme (never 'system' — always 'light' or 'dark'). */
  scheme: ResolvedScheme;
  /** Whether the resolved scheme is dark. */
  isDark: boolean;
  /** Named typography presets. */
  typography: typeof Typography;
  /** Spacing scale. */
  spacing: typeof Spacing;
  /** Border-radius tokens. */
  radius: typeof Radius;
  /** Cross-platform elevation/shadow presets. */
  elevation: typeof Elevation;
  /** Animation timing presets. */
  motion: typeof Motion;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the resolved theme based on the user's preference and the
 * system color scheme. Components should use this hook as their single
 * entry point for all design tokens.
 */
export function useTheme(): ThemeResult {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeStore((state) => state.mode);

  const scheme: ResolvedScheme =
    themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;

  return {
    colors: Colors[scheme],
    scheme,
    isDark: scheme === 'dark',
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    elevation: Elevation,
    motion: Motion,
  };
}

/**
 * Hook for accessing the resolved theme colors and current scheme.
 *
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/stores/theme';

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
}

/**
 * Returns the resolved theme based on the user's preference and the
 * system color scheme.
 */
export function useTheme(): ThemeResult {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeStore((state) => state.mode);

  const scheme: ResolvedScheme =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  return {
    colors: Colors[scheme],
    scheme,
    isDark: scheme === 'dark',
  };
}

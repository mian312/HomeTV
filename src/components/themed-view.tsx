/**
 * ThemedView — a theme-aware View component.
 *
 * Applies a semantic background color from the design system.
 * Use `type` to select a background color token.
 */

import { View, type ViewProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  /** Semantic background color from the theme palette. @default 'background' */
  type?: ThemeColor;
};

export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[{ backgroundColor: colors[type ?? 'background'] }, style]}
      {...otherProps}
    />
  );
}

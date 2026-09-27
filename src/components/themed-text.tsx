/**
 * ThemedText — a theme-aware text component.
 *
 * All typography uses centralized presets from the design system.
 * The `variant` prop selects a Typography preset; `themeColor` overrides color.
 */

import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor, TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /**
   * Typography preset to apply.
   *
   * Maps directly to keys in the `Typography` token set.
   * @default 'body'
   */
  variant?: TypographyVariant;

  /**
   * Legacy `type` prop — supported for backward compatibility with
   * the starter template. Prefer `variant` in new code.
   */
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';

  /** Override the text color with a semantic theme color. */
  themeColor?: ThemeColor;
};

/**
 * Map legacy `type` values to the new Typography variants.
 */
const LEGACY_VARIANT_MAP: Record<NonNullable<ThemedTextProps['type']>, TypographyVariant> = {
  default: 'body',
  title: 'displayLarge',
  small: 'bodySmall',
  smallBold: 'titleSmall',
  subtitle: 'displaySmall',
  link: 'bodySmall',
  linkPrimary: 'bodySmall',
  code: 'code',
};

export function ThemedText({
  style,
  variant,
  type,
  themeColor,
  ...rest
}: ThemedTextProps) {
  const { colors, typography } = useTheme();

  // Resolve which Typography preset to use
  const resolvedVariant: TypographyVariant =
    variant ?? (type ? LEGACY_VARIANT_MAP[type] : 'body');

  // Resolve text color
  const resolvedColor =
    type === 'linkPrimary'
      ? colors.primary
      : colors[themeColor ?? 'text'];

  return (
    <Text
      style={[
        typography[resolvedVariant],
        { color: resolvedColor },
        // Legacy overrides for exact backward compat where presets differ
        type === 'title' && legacyStyles.title,
        type === 'small' && legacyStyles.small,
        type === 'smallBold' && legacyStyles.smallBold,
        type === 'default' && legacyStyles.default,
        type === 'code' && legacyStyles.code,
        style,
      ]}
      {...rest}
    />
  );
}

/**
 * Temporary overrides to keep the starter screens pixel-identical.
 * These will be removed when the starter UI is replaced by HomeTV screens.
 */
const legacyStyles = StyleSheet.create({
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  code: {
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});

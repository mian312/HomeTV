/**
 * Badge — a small label chip for categories, counts, statuses.
 *
 * Variants: default · secondary · outline · success · warning · error
 */

import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { ThemeColors, useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveBadgeColors(
  variant: BadgeVariant,
  colors: ThemeColors,
): { bg: string; text: string; border?: string } {
  switch (variant) {
    case 'secondary':
      return { bg: colors.backgroundElement, text: colors.textSecondary };
    case 'outline':
      return { bg: 'transparent', text: colors.text, border: colors.border };
    case 'success':
      return { bg: colors.successMuted, text: colors.success };
    case 'warning':
      return { bg: colors.warningMuted, text: colors.warning };
    case 'error':
      return { bg: colors.errorMuted, text: colors.error };
    default: // 'default'
      return { bg: colors.primary, text: colors.primaryText };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Badge({ label, variant = 'default', style, testID }: BadgeProps) {
  const { colors } = useTheme();
  const { bg, text, border } = resolveBadgeColors(variant, colors);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { backgroundColor: bg },
        border ? { borderWidth: 1, borderColor: border } : undefined,
        style,
      ]}
    >
      <ThemedText
        variant="overline"
        style={{ color: text }}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

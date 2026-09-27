/**
 * Card — a themed surface container.
 *
 * Used for channel cards, list items, and info panels.
 * Provides background, border radius, and optional elevation.
 *
 * Variants:
 *   default    — surface color, subtle shadow
 *   elevated   — backgroundElevated + stronger shadow
 *   outlined   — transparent with a border
 *   ghost      — transparent, no shadow, no border
 */

import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

interface BaseCardProps {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  testID?: string;
}

export interface CardProps extends BaseCardProps {
  /** When supplied, the card becomes pressable with a scale animation. */
  onPress?: () => void;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useCardStyle(variant: CardVariant) {
  const { colors } = useTheme();

  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.backgroundElevated,
        ...Elevation.md,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        ...Elevation.none,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        ...Elevation.none,
      };
    default: // 'default'
      return {
        backgroundColor: colors.surface,
        ...Elevation.sm,
      };
  }
}

// ---------------------------------------------------------------------------
// Non-pressable Card
// ---------------------------------------------------------------------------

export function Card({ variant = 'default', style, children, testID }: BaseCardProps) {
  const variantStyle = useCardStyle(variant);
  return (
    <View testID={testID} style={[styles.container, variantStyle, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pressable Card (for channel items, etc.)
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableCard({
  variant = 'default',
  style,
  children,
  onPress,
  accessibilityLabel,
  testID,
}: CardProps) {
  const variantStyle = useCardStyle(variant);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      // eslint-disable-next-line react-hooks/immutability
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 80 }); }}
      // eslint-disable-next-line react-hooks/immutability
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.container, variantStyle, style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

// Card sub-sections (composable)
export function CardHeader({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.header, style]}>{children}</View>;
}
export function CardContent({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.content, style]}>{children}</View>;
}
export function CardFooter({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

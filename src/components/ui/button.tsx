/**
 * Button — a versatile pressable button component.
 *
 * API is inspired by React Native Reusables (shadcn/ui for RN) but
 * implemented with our own design-system tokens. No NativeWind required.
 *
 * Variants: default · secondary · outline · ghost · destructive · link
 * Sizes:    sm · md · lg · icon
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Elevation, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { ThemeColors, useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps {
  /** Visual style variant. @default 'default' */
  variant?: ButtonVariant;
  /** Size preset. @default 'md' */
  size?: ButtonSize;
  /** Disable the button and show an optional spinner. */
  disabled?: boolean;
  /** Show loading spinner; also disables the button. */
  loading?: boolean;
  /** Content — typically a Text or Icon. */
  children: React.ReactNode;
  /** Press handler. */
  onPress?: () => void;
  /** Custom outer container style. */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label (required when button has icon-only content). */
  accessibilityLabel?: string;
  /** ID for automated testing. */
  testID?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveVariantStyles(
  variant: ButtonVariant,
  colors: ThemeColors,
): { container: ViewStyle; pressedOpacity: number } {
  switch (variant) {
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.backgroundElement,
          borderWidth: 0,
        },
        pressedOpacity: 0.7,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        },
        pressedOpacity: 0.6,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 0,
        },
        pressedOpacity: 0.5,
      };
    case 'destructive':
      return {
        container: {
          backgroundColor: colors.error,
          borderWidth: 0,
        },
        pressedOpacity: 0.8,
      };
    case 'link':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 0,
          minHeight: 0,
        },
        pressedOpacity: 0.5,
      };
    default: // 'default'
      return {
        container: {
          backgroundColor: colors.primary,
          borderWidth: 0,
        },
        pressedOpacity: 0.85,
      };
  }
}

function resolveSizeStyles(size: ButtonSize): ViewStyle {
  switch (size) {
    case 'sm':
      return {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.sm,
        minHeight: 36,
      };
    case 'lg':
      return {
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        minHeight: 52,
      };
    case 'icon':
      return {
        width: MinTouchTarget,
        height: MinTouchTarget,
        borderRadius: Radius.md,
        paddingHorizontal: 0,
        paddingVertical: 0,
      };
    default: // 'md'
      return {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        minHeight: MinTouchTarget,
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onPress,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;
  const { container: variantStyle, pressedOpacity } = resolveVariantStyles(variant, colors);
  const sizeStyle = resolveSizeStyles(size);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withTiming(0.97, { duration: 80 });
  };
  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withTiming(1, { duration: 120 });
  };

  // Spinner color
  const spinnerColor =
    variant === 'default' || variant === 'destructive' ? colors.primaryText : colors.text;

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={isDisabled ? undefined : handlePressIn}
      onPressOut={isDisabled ? undefined : handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      testID={testID}
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        isDisabled && styles.disabled,
        style,
        animatedStyle,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            size === 'icon' && styles.iconInner,
            pressed && !isDisabled && { opacity: pressedOpacity },
          ]}
        >
          {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : children}
        </View>
      )}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    ...Elevation.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  iconInner: {
    width: '100%',
    height: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
});

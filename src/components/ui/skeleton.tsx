/**
 * Skeleton — animated loading placeholder.
 *
 * Uses Reanimated's withRepeat to pulse between two background colors.
 * Wrap any area with a Skeleton to indicate content is loading.
 *
 * Usage:
 *   <Skeleton width={200} height={16} radius="sm" />
 *   <Skeleton width="100%" height={120} radius="md" />
 */

import { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkeletonRadius = keyof typeof Radius;

export interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  /** Border radius preset. @default 'sm' */
  radius?: SkeletonRadius;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Skeleton({ width, height, radius = 'sm', style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const baseColor = isDark ? colors.backgroundElement : colors.backgroundElement;
  const highlightColor = isDark ? colors.backgroundSelected : colors.backgroundSelected;

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [baseColor, highlightColor]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        animatedStyle,
        {
          width,
          height,
          borderRadius: Radius[radius],
        },
        style,
      ]}
    />
  );
}

// Convenience row of skeletons for list items
export function SkeletonRow({ lines = 2 }: { lines?: number }) {
  return (
    <Animated.View style={styles.row}>
      <Skeleton width={40} height={40} radius="sm" />
      <Animated.View style={styles.rowLines}>
        <Skeleton width="70%" height={14} radius="xs" />
        {lines >= 2 && <Skeleton width="45%" height={11} radius="xs" style={{ marginTop: 6 }} />}
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowLines: {
    flex: 1,
    gap: 0,
  },
});

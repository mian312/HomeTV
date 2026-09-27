/**
 * SectionHeader — OTT-style section title row.
 *
 * A horizontal row with a title on the left and an optional
 * "See all" action link on the right. Used at the top of every
 * horizontal scroll section on the Home screen.
 *
 * Usage:
 *   <SectionHeader title="Featured" />
 *   <SectionHeader title="Sports" onSeeAll={() => router.push('/channels?category=sports')} />
 */

import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export interface SectionHeaderProps {
  title: string;
  /** Label for the trailing action. @default 'See all' */
  seeAllLabel?: string;
  /** When supplied, renders a pressable "See all" link. */
  onSeeAll?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SectionHeader({
  title,
  seeAllLabel = 'See all',
  onSeeAll,
  style,
  testID,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ThemedText variant="headlineSmall" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>

      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
          hitSlop={8}
        >
          <ThemedText variant="titleSmall" style={{ color: colors.primary }}>
            {seeAllLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});

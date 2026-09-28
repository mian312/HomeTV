/**
 * SectionHeader — OTT-style section title row.
 *
 * A horizontal row with a bold title on the left and an optional
 * "See all" action link on the right.
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
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      <ThemedText numberOfLines={1} style={[styles.title, { color: colors.text }]}>
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
          <ThemedText style={[styles.seeAll, { color: colors.primary }]}>
            {seeAllLabel} ›
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  accentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});

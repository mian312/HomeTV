import React from 'react';
import { StyleSheet, ScrollView, Pressable, ViewStyle, StyleProp } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export interface FilterChipProps {
  readonly label: string;
  readonly isSelected: boolean;
  readonly onPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function FilterChip({ label, isSelected, onPress, style }: FilterChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : colors.backgroundElement,
          borderColor: isSelected ? colors.primary : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <ThemedText
        variant="bodySmall"
        style={[
          styles.label,
          { color: isSelected ? colors.background : colors.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export interface FilterRowProps<T> {
  readonly items: readonly T[];
  readonly selectedItem: T | null;
  readonly onSelect: (item: T | null) => void;
  readonly getLabel: (item: T) => string;
  readonly getKey: (item: T) => string;
  readonly style?: StyleProp<ViewStyle>;
  readonly emptyLabel?: string;
}

export function FilterRow<T>({
  items,
  selectedItem,
  onSelect,
  getLabel,
  getKey,
  style,
  emptyLabel = 'All',
}: FilterRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.scrollContent}
    >
      <FilterChip
        label={emptyLabel}
        isSelected={selectedItem === null}
        onPress={() => onSelect(null)}
      />
      {items.map((item) => (
        <FilterChip
          key={getKey(item)}
          label={getLabel(item)}
          isSelected={selectedItem === item}
          onPress={() => onSelect(selectedItem === item ? null : item)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
  },
});

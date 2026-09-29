import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { LoadingView, Input } from '@/components/ui';
import { useCategories } from '@/data/queries/iptv';

interface CategoryStepProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function CategoryStep({ selectedCategories, onChange }: CategoryStepProps) {
  const { colors, spacing, radius } = useTheme();
  const { data: categories, isLoading, error } = useCategories();
  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingView message="Loading categories…" />;
  if (error || !categories) {
    return (
      <View style={styles.center}>
        <ThemedText themeColor="error">Failed to load categories.</ThemedText>
      </View>
    );
  }

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((c) => c !== id));
    } else {
      onChange([...selectedCategories, id]);
    }
  }

  return (
    <View style={styles.container}>
      <Input
        placeholder="Search categories…"
        value={search}
        onChangeText={setSearch}
        containerStyle={{ marginBottom: spacing.md }}
      />
      
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => {
          const isSelected = selectedCategories.includes(item.id);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggle(item.id)}
              style={[
                styles.item,
                {
                  backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <ThemedText variant="titleSmall">{item.name}</ThemedText>
              </View>
              {isSelected && (
                <ThemedText themeColor="primary" style={{ fontWeight: 'bold' }}>
                  ✓
                </ThemedText>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
});

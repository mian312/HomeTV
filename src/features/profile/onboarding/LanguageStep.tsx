import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { LoadingView, Input } from '@/components/ui';
import { useLanguages } from '@/data/queries/iptv';

interface LanguageStepProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export function LanguageStep({ selectedLanguages, onChange }: LanguageStepProps) {
  const { colors, spacing, radius } = useTheme();
  const { data: languages, isLoading, error } = useLanguages();
  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingView message="Loading languages…" />;
  if (error || !languages) {
    return (
      <View style={styles.center}>
        <ThemedText themeColor="error">Failed to load languages.</ThemedText>
      </View>
    );
  }

  const filtered = languages.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(code: string) {
    if (selectedLanguages.includes(code)) {
      onChange(selectedLanguages.filter((c) => c !== code));
    } else {
      onChange([...selectedLanguages, code]);
    }
  }

  return (
    <View style={styles.container}>
      <Input
        placeholder="Search languages…"
        value={search}
        onChangeText={setSearch}
        containerStyle={{ marginBottom: spacing.md }}
      />
      
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => {
          const isSelected = selectedLanguages.includes(item.code);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggle(item.code)}
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
                <ThemedText variant="bodySmall" style={{ opacity: 0.7 }}>
                  {item.code.toUpperCase()}
                </ThemedText>
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

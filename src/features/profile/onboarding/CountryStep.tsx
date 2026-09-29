import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { LoadingView, Input } from '@/components/ui';
import { useCountries } from '@/data/queries/iptv';

interface CountryStepProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
}

export function CountryStep({ selectedCountries, onChange }: CountryStepProps) {
  const { colors, spacing, radius } = useTheme();
  const { data: countries, isLoading, error } = useCountries();
  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingView message="Loading countries…" />;
  if (error || !countries) {
    return (
      <View style={styles.center}>
        <ThemedText themeColor="error">Failed to load countries.</ThemedText>
      </View>
    );
  }

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(code: string) {
    if (selectedCountries.includes(code)) {
      onChange(selectedCountries.filter((c) => c !== code));
    } else {
      onChange([...selectedCountries, code]);
    }
  }

  return (
    <View style={styles.container}>
      <Input
        placeholder="Search countries…"
        value={search}
        onChangeText={setSearch}
        containerStyle={{ marginBottom: spacing.md }}
      />
      
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => {
          const isSelected = selectedCountries.includes(item.code);
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
              <ThemedText style={{ fontSize: 24, marginRight: spacing.md }}>
                {item.flag}
              </ThemedText>
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

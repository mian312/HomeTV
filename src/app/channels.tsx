import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChannels, useCategories, useCountries } from '@/data/queries/iptv';
import { ChannelCard, ErrorView, LoadingView, FilterRow, Input } from '@/components/ui';
import type { CategoryId, CountryCode } from '@/types/domain';

export default function ChannelsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const { data: channels, isLoading: channelsLoading, isError: channelsError, refetch } = useChannels();
  const { data: categories } = useCategories();
  const { data: countries } = useCountries();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    const query = searchQuery.trim().toLowerCase();
    
    return channels.filter(c => {
      if (selectedCategory && !c.categories.includes(selectedCategory)) return false;
      if (selectedCountry && c.country !== selectedCountry) return false;
      if (query) {
        if (!c.name.toLowerCase().includes(query) && !c.id.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [channels, selectedCategory, selectedCountry, searchQuery]);

  if (channelsLoading) {
    return <LoadingView message="Loading catalog..." />;
  }

  if (channelsError) {
    return <ErrorView message="Failed to load catalog" onRetry={refetch} />;
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.listContent, contentPlatformStyle]}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <ChannelCard channel={item} style={styles.gridCard} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <ThemedView style={styles.header}>
              <ThemedText type="subtitle">All Channels</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Browse the complete catalog
              </ThemedText>
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={styles.searchContainer}
              />
            </ThemedView>
            
            {categories && (
              <FilterRow
                items={categories.map(c => c.id)}
                selectedItem={selectedCategory}
                onSelect={setSelectedCategory}
                getLabel={(id) => categories.find(c => c.id === id)?.name ?? id}
                getKey={(id) => id}
                style={styles.filterRow}
                emptyLabel="All Categories"
              />
            )}
            
            {countries && (
              <FilterRow
                items={countries.map(c => c.code)}
                selectedItem={selectedCountry}
                onSelect={setSelectedCountry}
                getLabel={(code) => countries.find(c => c.code === code)?.name ?? code}
                getKey={(code) => code}
                style={styles.filterRow}
                emptyLabel="All Countries"
              />
            )}
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '48%', // Ensure 2 columns fit with spacing
  },
  gridCard: {
    width: '100%',
    marginRight: 0,
  },
  header: {
    paddingVertical: Spacing.xl,
    gap: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.four, // negate parent padding
  },
});

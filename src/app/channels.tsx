import { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChannelCard, ErrorView, Input, LoadingView, ModalPicker } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCategories, useChannels, useCountries } from '@/data/queries/iptv';
import type { CategoryId, CountryCode } from '@/types/domain';

export default function ChannelsScreen() {
  const contentPlatformStyle = Platform.select({
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
      <SafeAreaView edges={['top', 'left', 'right']}>
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
            <View style={styles.headerContainer}>
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
              
              <View style={styles.filtersRow}>
                {categories && (
                  <ModalPicker
                    title="Select Category"
                    placeholder="Categories"
                    items={categories.map(c => ({ label: c.name, value: c.id }))}
                    selectedValue={selectedCategory}
                    onValueChange={setSelectedCategory}
                  />
                )}
                
                {countries && (
                  <ModalPicker
                    title="Select Country"
                    placeholder="Countries"
                    items={countries.map(c => ({ label: c.name, value: c.code }))}
                    selectedValue={selectedCountry}
                    onValueChange={setSelectedCountry}
                  />
                )}
              </View>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.xl,
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
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  header: {
    paddingVertical: Spacing.lg,
    gap: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.xs,
  },
  searchContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});

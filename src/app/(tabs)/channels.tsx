import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChannelCard, ErrorView, Input, LoadingView, ModalPicker } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useCategories, useChannels, useCountries } from '@/data/queries/iptv';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryId, CountryCode } from '@/types/domain';

export default function ChannelsScreen() {
  const { colors } = useTheme();

  const contentPlatformStyle = Platform.select({
    web: {
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
  });

  const {
    data: channels,
    isLoading: channelsLoading,
    isError: channelsError,
    refetch,
  } = useChannels();
  const { data: categories } = useCategories();
  const { data: countries } = useCountries();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    const query = deferredSearchQuery.trim().toLowerCase();

    return channels.filter((c) => {
      if (selectedCategory && !c.categories.includes(selectedCategory)) return false;
      if (selectedCountry && c.country !== selectedCountry) return false;
      if (query) {
        if (!c.name.toLowerCase().includes(query) && !c.id.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [channels, selectedCategory, selectedCountry, deferredSearchQuery]);

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
              {/* Page title */}
              <View style={styles.titleRow}>
                <ThemedText style={[styles.pageTitle, { color: colors.text }]}>Browse</ThemedText>
                <ThemedText style={[styles.resultCount, { color: colors.textSecondary }]}>
                  {filteredChannels.length} channels
                </ThemedText>
              </View>

              {/* Search bar */}
              <View
                style={[
                  styles.searchWrapper,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                ]}
              >
                <ThemedText style={{ color: colors.textTertiary, fontSize: 16 }}>🔍</ThemedText>
                <Input
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  containerStyle={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <ThemedText style={{ color: colors.textTertiary }}>✕</ThemedText>
                  </Pressable>
                )}
              </View>

              {/* Filter pills row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {/* Category filter */}
                {categories && (
                  <ModalPicker
                    title="Select Category"
                    placeholder="Categories"
                    items={categories.map((c) => ({ label: c.name, value: c.id }))}
                    selectedValue={selectedCategory}
                    onValueChange={setSelectedCategory}
                  />
                )}

                {/* Country filter */}
                {countries && (
                  <ModalPicker
                    title="Select Country"
                    placeholder="Countries"
                    items={countries.map((c) => ({ label: c.name, value: c.code }))}
                    selectedValue={selectedCountry}
                    onValueChange={setSelectedCountry}
                  />
                )}

                {/* Active filters clear */}
                {(selectedCategory || selectedCountry) && (
                  <Pressable
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedCountry(null);
                    }}
                    style={({ pressed }) => [
                      styles.clearBtn,
                      { backgroundColor: colors.errorMuted, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <ThemedText style={[styles.clearBtnText, { color: colors.error }]}>
                      Clear filters ✕
                    </ThemedText>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No channels match your search.
              </ThemedText>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.xl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '48.5%',
  },
  gridCard: {
    width: '100%',
    marginRight: 0,
  },

  // Header
  headerContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },

  // Filters
  filterScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty
  emptyContainer: {
    paddingVertical: Spacing.massive,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});

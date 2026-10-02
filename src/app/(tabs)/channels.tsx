import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChannelCard, ErrorView, Input, LoadingView, ModalMultiPicker } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useCategories, useChannels, useCountries, useLanguages } from '@/data/queries/iptv';
import { useTheme } from '@/hooks/use-theme';
import { usePersonalizationModel } from '@/features/personalization/hooks';
import { getDefaultFilterState } from '@/features/personalization/defaults';
import { filterChannels, type FilterState } from '@/features/personalization/filtering';

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
  const { data: languages } = useLanguages();

  const { data: personalizationModel } = usePersonalizationModel();
  
  const defaultFilters = useMemo(() => {
    return personalizationModel ? getDefaultFilterState(personalizationModel) : {};
  }, [personalizationModel]);

  const [explicitFilters, setExplicitFilters] = useState<FilterState | null>(null);

  const activeFilters = explicitFilters ?? defaultFilters;

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const currentFilterState = useMemo<FilterState>(() => {
    return {
      ...activeFilters,
      searchQuery: deferredSearchQuery.trim()
    };
  }, [activeFilters, deferredSearchQuery]);

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    return filterChannels(channels, currentFilterState);
  }, [channels, currentFilterState]);

  const setFilter = (key: keyof FilterState, value: any) => {
    setExplicitFilters(prev => {
      const next = { ...(prev ?? defaultFilters) };
      next[key] = value;
      return next;
    });
  };

  const hasExplicitFilters = explicitFilters !== null;

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
                  <ModalMultiPicker
                    title="Select Categories"
                    placeholder="Categories"
                    items={categories.map((c) => ({ label: c.name, value: c.id }))}
                    selectedValues={activeFilters.categories ?? []}
                    onValuesChange={(vals) => setFilter('categories', vals)}
                  />
                )}

                {/* Country filter */}
                {countries && (
                  <ModalMultiPicker
                    title="Select Countries"
                    placeholder="Countries"
                    items={countries.map((c) => ({ label: c.name, value: c.code }))}
                    selectedValues={activeFilters.countries ?? []}
                    onValuesChange={(vals) => setFilter('countries', vals)}
                  />
                )}
                
                {/* Language filter */}
                {languages && (
                  <ModalMultiPicker
                    title="Select Languages"
                    placeholder="Languages"
                    items={languages.map((l) => ({ label: l.name, value: l.code }))}
                    selectedValues={activeFilters.languages ?? []}
                    onValuesChange={(vals) => setFilter('languages', vals)}
                  />
                )}

                {/* Active filters clear */}
                {hasExplicitFilters && (
                  <Pressable
                    onPress={() => setExplicitFilters(null)}
                    style={({ pressed }) => [
                      styles.clearBtn,
                      { backgroundColor: colors.errorMuted, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <ThemedText style={[styles.clearBtnText, { color: colors.error }]}>
                      Reset to defaults ✕
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

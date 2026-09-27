import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFavorites, useRecentlyWatched, usePlaylists } from '@/data/queries/local';
import { ChannelCard, HorizontalList, LoadingView, PressableCard, CardContent, SectionHeader } from '@/components/ui';
import { useChannels } from '@/data/queries/iptv';
import type { Channel } from '@/types/domain';
import { SymbolView } from 'expo-symbols';

export default function LibraryScreen() {
  const { data: favorites } = useFavorites();
  const { data: recentlyWatched } = useRecentlyWatched();
  const { data: playlists } = usePlaylists();
  const { data: channels, isLoading } = useChannels();
  const { colors } = useTheme();

  if (isLoading) {
    return <LoadingView message="Loading library..." />;
  }

  // Hydrate local entities with channel data
  const favoriteChannels = (favorites ?? [])
    .map(f => channels?.find(c => c.id === f.entityRef.entityId))
    .filter((c): c is Channel => c !== undefined);

  const historyChannels = (recentlyWatched ?? [])
    .map(h => channels?.find(c => c.id === h.entityRef.entityId))
    .filter((c): c is Channel => c !== undefined);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">My Library</ThemedText>
            <ThemedText themeColor="textSecondary">
              Your favorites, history, and playlists
            </ThemedText>
          </ThemedView>

          {historyChannels.length > 0 && (
            <View style={styles.section}>
              <HorizontalList
                title="Recently Watched"
                data={historyChannels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChannelCard channel={item} />}
              />
            </View>
          )}

          {favoriteChannels.length > 0 ? (
            <View style={styles.section}>
              <HorizontalList
                title="Favorites"
                data={favoriteChannels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChannelCard channel={item} />}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No favorites yet. Tap the heart on a channel to save it here.
              </ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Playlists" seeAllLabel="Create" onSeeAll={() => console.log('Create playlist')} style={styles.sectionHeader} />
            {playlists && playlists.length > 0 ? (
              <View style={styles.playlistsContainer}>
                {playlists.map(p => (
                  <PressableCard key={p.id} variant="elevated" style={styles.playlistCard}>
                    <CardContent style={styles.playlistContent}>
                      <SymbolView name="list.bullet" size={24} tintColor={colors.primary} />
                      <View style={styles.playlistText}>
                        <ThemedText style={{ fontWeight: '600' }}>{p.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </CardContent>
                  </PressableCard>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  No playlists created.
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
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
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.xl,
    gap: Spacing.one,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.md,
  },
  playlistsContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.sm,
  },
  playlistCard: {
    width: '100%',
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  playlistText: {
    flex: 1,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});

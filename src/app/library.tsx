import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useFavorites, useRecentlyWatched } from '@/data/queries/local';
import { ChannelCard, HorizontalList, LoadingView } from '@/components/ui';
import { useChannels } from '@/data/queries/iptv';
import type { Channel } from '@/types/domain';

export default function LibraryScreen() {
  const { data: favorites } = useFavorites();
  const { data: recentlyWatched } = useRecentlyWatched();
  const { data: channels, isLoading } = useChannels();

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
        <View style={styles.content}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">My Library</ThemedText>
            <ThemedText themeColor="textSecondary">
              Your favorites and recently watched channels
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
        </View>
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.xl,
    gap: Spacing.one,
  },
  section: {
    marginBottom: Spacing.xl,
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

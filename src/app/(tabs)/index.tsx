import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ChannelCard, HorizontalList, LoadingView, ErrorView } from '@/components/ui';
import { useChannels } from '@/data/queries/iptv';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useMemo } from 'react';

export default function HomeScreen() {
  const { data: channels, isLoading, isError, refetch } = useChannels();

  // Pick some categories for the home screen (just arbitrary slices for now)
  const featured = useMemo(() => channels?.slice(0, 10) ?? [], [channels]);
  const news = useMemo(
    () => channels?.filter((c) => c.categories.includes('news' as any)).slice(0, 10) ?? [],
    [channels],
  );
  const music = useMemo(
    () => channels?.filter((c) => c.categories.includes('music' as any)).slice(0, 10) ?? [],
    [channels],
  );

  if (isLoading) {
    return <LoadingView message="Loading channels..." />;
  }

  if (isError) {
    return <ErrorView message="Failed to load channels" onRetry={refetch} />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HorizontalList
            title="Featured Channels"
            data={featured}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChannelCard channel={item} />}
          />

          {news.length > 0 && (
            <HorizontalList
              title="News"
              data={news}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChannelCard channel={item} />}
            />
          )}

          {music.length > 0 && (
            <HorizontalList
              title="Music"
              data={music}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChannelCard channel={item} />}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', // Center on large screens
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
});

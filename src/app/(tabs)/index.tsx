import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChannelCard, ErrorView, HorizontalList, LoadingView } from '@/components/ui';
import { ChannelLogo } from '@/components/ui/channel-logo';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useChannels } from '@/data/queries/iptv';
import { useTheme } from '@/hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: channels, isLoading, isError, refetch } = useChannels();

  const featured = useMemo(() => channels?.slice(0, 12) ?? [], [channels]);
  const heroChannel = useMemo(() => channels?.[0] ?? null, [channels]);
  const news = useMemo(
    () => channels?.filter((c) => c.categories.includes('news' as any)).slice(0, 12) ?? [],
    [channels],
  );
  const sports = useMemo(
    () => channels?.filter((c) => c.categories.includes('sports' as any)).slice(0, 12) ?? [],
    [channels],
  );
  const entertainment = useMemo(
    () => channels?.filter((c) => c.categories.includes('entertainment' as any)).slice(0, 12) ?? [],
    [channels],
  );
  const music = useMemo(
    () => channels?.filter((c) => c.categories.includes('music' as any)).slice(0, 12) ?? [],
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Banner ── */}
          {heroChannel && (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/player/[channelId]', params: { channelId: heroChannel.id } })
              }
              style={styles.heroContainer}
            >
              <View style={[styles.heroBg, { backgroundColor: colors.backgroundElement }]}>
                <ChannelLogo
                  channel={heroChannel}
                  style={styles.heroLogo}
                />
              </View>

              {/* Gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', colors.background]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* LIVE badge */}
              <View style={styles.heroContent}>
                <View style={[styles.liveBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={styles.liveBadgeText}>● LIVE</ThemedText>
                </View>
                <ThemedText style={styles.heroTitle} numberOfLines={2}>
                  {heroChannel.name}
                </ThemedText>
                <ThemedText style={[styles.heroSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {heroChannel.country ?? 'International'} · Live Broadcast
                </ThemedText>

                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/player/[channelId]', params: { channelId: heroChannel.id } })
                  }
                  style={({ pressed }) => [
                    styles.watchNowBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <ThemedText style={styles.watchNowText}>▶  Watch Now</ThemedText>
                </Pressable>
              </View>
            </Pressable>
          )}

          {/* ── Sections ── */}
          <View style={styles.sectionsContainer}>
            <HorizontalList
              title="Featured Channels"
              data={featured}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChannelCard channel={item} />}
            />

            {sports.length > 0 && (
              <HorizontalList
                title="Sports"
                data={sports}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChannelCard channel={item} />}
              />
            )}

            {news.length > 0 && (
              <HorizontalList
                title="News"
                data={news}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChannelCard channel={item} />}
              />
            )}

            {entertainment.length > 0 && (
              <HorizontalList
                title="Entertainment"
                data={entertainment}
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
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Banner
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    opacity: 0.35,
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.xxl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginBottom: Spacing.sm,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: Spacing.lg,
  },
  watchNowBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.xl,
  },
  watchNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Sections
  sectionsContainer: {
    gap: Spacing.lg,
  },
});

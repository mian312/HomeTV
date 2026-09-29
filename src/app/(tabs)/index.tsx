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
import { ErrorView, LoadingView } from '@/components/ui';
import { ChannelLogo } from '@/components/ui/channel-logo';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useChannels } from '@/data/queries/iptv';
import { useTheme } from '@/hooks/use-theme';
import { usePersonalizationModel, resolveHomeSections, sortChannelsByScore } from '@/features/personalization';
import { HomeSectionRenderer } from '@/features/personalization/ui/HomeSectionRenderer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: channels, isLoading: isChannelsLoading, isError, refetch } = useChannels();
  const { data: model, isLoading: isModelLoading } = usePersonalizationModel();

  const filteredChannels = useMemo(() => {
    if (!channels || channels.length === 0) return [];
    if (!model) return channels;
    if (model.preferredCountries.size === 0 && model.preferredLanguages.size === 0) return channels;
    
    let result = channels;
    if (model.preferredCountries.size > 0) {
      const preferredCountries = Array.from(model.preferredCountries);
      result = result.filter(c => c.country && preferredCountries.includes(c.country));
    }
    // Note: Channel.languages is not populated by iptv-org channels.json, so filtering
    // by language here would result in an empty list. Skip language filtering.
    return result;
  }, [channels, model]);

  const sections = useMemo(() => {
    if (!model) return [];
    return resolveHomeSections(model);
  }, [model]);

  if (isChannelsLoading || isModelLoading) {
    return <LoadingView message="Loading personalized home..." />;
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
          {/* ── Active Filters ── */}
          {model && (model.preferredCountries.size > 0 || model.preferredLanguages.size > 0) && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.sm }}
            >
              {Array.from(model.preferredCountries).map(country => (
                <View key={`country-${country}`} style={[styles.filterBadge, { backgroundColor: colors.backgroundElement, borderColor: colors.primary }]}>
                  <ThemedText variant="bodySmall">📍 {country.toUpperCase()}</ThemedText>
                </View>
              ))}
              {Array.from(model.preferredLanguages).map(lang => (
                <View key={`lang-${lang}`} style={[styles.filterBadge, { backgroundColor: colors.backgroundElement, borderColor: colors.primary }]}>
                  <ThemedText variant="bodySmall">🗣 {lang.toUpperCase()}</ThemedText>
                </View>
              ))}
            </ScrollView>
          )}

          {/* ── Sections ── */}
          <View style={styles.sectionsContainer}>
            {model && channels && sections.map((descriptor, index) => (
              <HomeSectionRenderer
                key={`${descriptor.type}-${index}`}
                descriptor={descriptor}
                channels={
                  descriptor.type === 'recently-watched' || descriptor.type === 'favorites' 
                    ? channels 
                    : filteredChannels
                }
                model={model}
              />
            ))}
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

  sectionsContainer: {
    gap: Spacing.lg,
  },
  filterBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  }
});

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ChannelLogo } from '@/components/ui/channel-logo';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import type { Channel } from '@/types/domain';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

interface HeroCarouselProps {
  channels: readonly Channel[];
}

export function HeroCarousel({ channels }: HeroCarouselProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!channels || channels.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: Channel }) => {
    return (
      <Pressable
        onPress={() =>
          router.push({ pathname: '/player/[channelId]', params: { channelId: item.id } })
        }
        style={styles.heroContainer}
      >
        <View style={[styles.heroBg, { backgroundColor: colors.backgroundElement }]}>
          <ChannelLogo channel={item} style={styles.heroLogo} />
        </View>

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', colors.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Content */}
        <View style={styles.heroContent}>
          <View style={[styles.liveBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.liveBadgeText}>CONTINUE WATCHING</ThemedText>
          </View>
          <ThemedText style={styles.heroTitle} numberOfLines={2}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.country ?? 'International'} · {item.categories[0]?.toUpperCase() ?? 'LIVE'}
          </ThemedText>

          <View style={[styles.watchNowBtn, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.watchNowText}>▶  Watch Now</ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={(ev) => {
          const newIndex = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(newIndex);
        }}
      />
      {channels.length > 1 && (
        <View style={styles.pagination}>
          {channels.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? colors.primary : colors.border }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.xl,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroBg: {
    ...(StyleSheet.absoluteFill as any),
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
    bottom: Spacing.xl,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '../themed-text';

import { Radius, Spacing } from '@/constants/theme';
import {
  useChannelPlaylistMemberships,
  useIsFavorite,
  useToggleFavorite,
} from '@/data/queries/local';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';
import { SymbolView } from 'expo-symbols';
import { ChannelDetails } from './channel-details';
import { ChannelGuideSlider } from './channel-guide-slider';
import { ChannelLogo } from './channel-logo';
import { PlaylistPicker } from './playlist-picker';

interface ChannelCardProps {
  readonly channel: Channel;
  readonly onPress?: (channel: Channel) => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function ChannelCard({ channel, onPress, style }: ChannelCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const entityRef = { entityType: 'channel' as const, entityId: channel.id };
  const { data: isFavorite } = useIsFavorite(entityRef);
  const { data: playlistMemberships = [] } = useChannelPlaylistMemberships(channel.id);
  const { mutate: toggleFavorite } = useToggleFavorite();

  const handleFavoritePress = () => {
    toggleFavorite({
      entityRef,
      isFavorite: !!isFavorite,
    });
  };

  const handleChannelPress = () => {
    if (onPress) {
      onPress(channel);
      return;
    }
    router.push({ pathname: '/player/[channelId]', params: { channelId: channel.id } });
  };

  return (
    <>
      <Pressable
        onPress={handleChannelPress}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }, style]}
        accessibilityLabel={`Play ${channel.name}`}
      >
        {/* Logo thumbnail */}
        <View style={[styles.logoWrapper, { backgroundColor: colors.backgroundElement }]}>
          <ChannelLogo
            channel={channel}
            style={styles.logo}
          />
          {/* Gradient overlay on logo */}
          <View style={[styles.logoOverlay, { backgroundColor: colors.scrim }]} pointerEvents="none" />

          {/* LIVE badge on card */}
          <View style={[styles.liveBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.liveBadgeText}>LIVE</ThemedText>
          </View>

          {/* Favorite button top-right */}
          <Pressable
            onPress={handleFavoritePress}
            style={({ pressed }) => [styles.favoriteButton, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${isFavorite ? 'Remove' : 'Add'} ${channel.name} ${isFavorite ? 'from' : 'to'} favorites`}
            accessibilityState={{ selected: !!isFavorite }}
            testID="channel-favorite-action"
          >
            <SymbolView
              name={
                isFavorite
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              size={15}
              tintColor={isFavorite ? colors.primary : '#FFFFFF'}
              fallback={
                <ThemedText style={{ color: isFavorite ? colors.primary : '#FFFFFF', fontSize: 14 }}>
                  {isFavorite ? '♥' : '♡'}
                </ThemedText>
              }
            />
          </Pressable>

          {/* Playlist button top-left */}
          <Pressable
            onPress={() => setPlaylistPickerVisible(true)}
            style={({ pressed }) => [styles.playlistButton, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Add ${channel.name} to a playlist`}
            testID="channel-playlist-action"
          >
            <SymbolView
              name={{ ios: 'text.badge.plus', android: 'playlist_add', web: 'playlist_add' }}
              size={15}
              tintColor="#FFFFFF"
            />
            {playlistMemberships.length > 0 ? (
              <View style={[styles.playlistCount, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.playlistCountText}>
                  {playlistMemberships.length}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Card footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <ThemedText numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {channel.name}
          </ThemedText>
          <View style={styles.footerRow}>
            <ThemedText
              numberOfLines={1}
              style={[styles.meta, { color: colors.textTertiary, flex: 1 }]}
            >
              {channel.country ?? '—'}
            </ThemedText>

            {/* Info button */}
            <Pressable
              onPress={() => setDetailsVisible(true)}
              style={({ pressed }) => [styles.infoBtn, pressed && { opacity: 0.65 }]}
              accessibilityRole="button"
              accessibilityLabel={`Details for ${channel.name}`}
              testID="channel-details-action"
              hitSlop={6}
            >
              <SymbolView
                name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                size={14}
                tintColor={colors.textTertiary}
              />
            </Pressable>

            {/* Guide button */}
            <Pressable
              onPress={() => setGuideVisible(true)}
              style={({ pressed }) => [
                styles.guideBtn,
                { backgroundColor: colors.primaryMuted, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Show guide for ${channel.name}`}
              testID="channel-guide-action"
            >
              <ThemedText style={[styles.guideBtnText, { color: colors.primary }]}>Guide</ThemedText>
            </Pressable>
          </View>
        </View>
      </Pressable>

      <PlaylistPicker
        channel={channel}
        visible={playlistPickerVisible}
        onClose={() => setPlaylistPickerVisible(false)}
      />
      <ChannelDetails
        channel={channel}
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
      />
      {guideVisible ? (
        <ChannelGuideSlider channel={channel} onClose={() => setGuideVisible(false)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 155,
    marginRight: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  logoWrapper: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  liveBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  playlistButton: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  playlistCount: {
    position: 'absolute',
    top: -3,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCountText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.xxs,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  meta: {
    fontSize: 10,
    fontWeight: '400',
  },
  infoBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  guideBtnText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

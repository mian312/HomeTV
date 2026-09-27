import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '../themed-text';
import { CardContent, PressableCard } from './card';

import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
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
      <PressableCard
        variant="elevated"
        onPress={handleChannelPress}
        style={[styles.card, style]}
        accessibilityLabel={channel.name}
      >
        <CardContent style={styles.content}>
          <ChannelLogo
            channel={channel}
            style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundElement }]}
          />
          <View style={styles.textContainer}>
            <ThemedText numberOfLines={1} style={styles.name}>
              {channel.name}
            </ThemedText>
            <View style={styles.metaRow}>
              <ThemedText
                type="small"
                numberOfLines={1}
                style={[styles.category, { color: colors.textSecondary }]}
              >
                {channel.country ?? 'Unknown'}
              </ThemedText>
              <Pressable
                onPress={() => setDetailsVisible(true)}
                style={({ pressed }) => [styles.detailsButton, pressed && { opacity: 0.65 }]}
                accessibilityRole="button"
                accessibilityLabel={`Details for ${channel.name}`}
                testID="channel-details-action"
                hitSlop={6}
              >
                <SymbolView
                  name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                  size={17}
                  tintColor={colors.textTertiary}
                />
              </Pressable>
            </View>
            <Pressable
              onPress={() => setGuideVisible(true)}
              style={({ pressed }) => [
                styles.guideButton,
                { backgroundColor: colors.primaryMuted },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Show guide for ${channel.name}`}
              testID="channel-guide-action"
            >
              <SymbolView
                name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                size={15}
                tintColor={colors.primary}
              />
              <ThemedText
                variant="caption"
                style={[styles.guideButtonText, { color: colors.primary }]}
              >
                Guide
              </ThemedText>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setPlaylistPickerVisible(true)}
            style={({ pressed }) => [styles.playlistButton, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Add ${channel.name} to a playlist. In ${playlistMemberships.length} ${playlistMemberships.length === 1 ? 'playlist' : 'playlists'}.`}
            accessibilityHint="Opens the playlist picker"
            testID="channel-playlist-action"
          >
            <SymbolView
              name={{ ios: 'text.badge.plus', android: 'playlist_add', web: 'playlist_add' }}
              size={18}
              tintColor={colors.textTertiary}
            />
            {playlistMemberships.length > 0 ? (
              <View style={[styles.playlistCount, { backgroundColor: colors.primary }]}>
                <ThemedText style={[styles.playlistCountText, { color: colors.primaryText }]}>
                  {playlistMemberships.length}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
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
              size={18}
              tintColor={isFavorite ? colors.primary : colors.textTertiary}
              fallback={
                <ThemedText style={{ color: isFavorite ? colors.primary : colors.textTertiary }}>
                  {isFavorite ? '♥' : '♡'}
                </ThemedText>
              }
            />
          </Pressable>
        </CardContent>
      </PressableCard>
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
    width: 140,
    marginRight: 12,
  },
  content: {
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
  category: {
    flex: 1,
    textAlign: 'center',
  },
  metaRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  detailsButton: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideButton: {
    minHeight: MinTouchTarget,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  guideButtonText: {
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playlistButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playlistCount: {
    position: 'absolute',
    top: -4,
    right: -5,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCountText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
});

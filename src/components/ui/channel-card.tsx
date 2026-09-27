import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '../themed-text';
import { CardContent, PressableCard } from './card';

import {
  useChannelPlaylistMemberships,
  useIsFavorite,
  useToggleFavorite,
} from '@/data/queries/local';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';
import { SymbolView } from 'expo-symbols';
import { PlaylistPicker } from './playlist-picker';

interface ChannelCardProps {
  readonly channel: Channel;
  readonly onPress?: (channel: Channel) => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function ChannelCard({ channel, onPress, style }: ChannelCardProps) {
  const { colors } = useTheme();
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);

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

  return (
    <>
      <PressableCard
        variant="elevated"
        onPress={onPress ? () => onPress(channel) : undefined}
        style={[styles.card, style]}
        accessibilityLabel={channel.name}
      >
        <CardContent style={styles.content}>
          {channel.logoUrl ? (
            <Image
              source={{ uri: channel.logoUrl }}
              style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundElement }]}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={[styles.initials, { color: colors.textSecondary }]}>
                {channel.name.substring(0, 2).toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={styles.textContainer}>
            <ThemedText numberOfLines={1} style={styles.name}>
              {channel.name}
            </ThemedText>
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[styles.category, { color: colors.textSecondary }]}
            >
              {channel.country ?? 'Unknown'}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setPlaylistPickerVisible(true)}
            style={({ pressed }) => [styles.playlistButton, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Add ${channel.name} to a playlist. In ${playlistMemberships.length} ${playlistMemberships.length === 1 ? 'playlist' : 'playlists'}.`}
            testID="channel-playlist-action"
          >
            <SymbolView name="text.badge.plus" size={18} tintColor={colors.textTertiary} />
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
          >
            <SymbolView
              name={isFavorite ? 'heart.fill' : 'heart'}
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
  initials: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
  category: {
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playlistButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
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

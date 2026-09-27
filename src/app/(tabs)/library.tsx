import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
    Button,
    CardContent,
    ChannelAvatarStack,
    ChannelCard,
    ChannelLogo,
    ErrorView,
    HorizontalList,
    Input,
    LoadingView,
    PressableCard,
    SectionHeader,
    SlideUpSheet,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useChannels } from '@/data/queries/iptv';
import {
    useCreatePlaylist,
    useFavorites,
    usePlaylistItems,
    usePlaylistSummaries,
    usePlaylists,
    useRecentlyWatched,
    useRemovePlaylistItem,
} from '@/data/queries/local';
import { useTheme } from '@/hooks/use-theme';
import type { Channel, Playlist } from '@/types/domain';

export default function LibraryScreen() {
  const router = useRouter();
  const { data: favorites } = useFavorites();
  const { data: recentlyWatched } = useRecentlyWatched();
  const { data: playlists } = usePlaylists();
  const { data: playlistSummaries } = usePlaylistSummaries();
  const { data: channels, isLoading, refetch } = useChannels();
  const { colors } = useTheme();
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const createPlaylist = useCreatePlaylist();
  const removePlaylistItem = useRemovePlaylistItem();
  const activePlaylist = playlists?.find((playlist) => playlist.id === activePlaylistId);
  const { data: activeItems = [], isLoading: itemsLoading } = usePlaylistItems(
    activePlaylistId ?? '',
  );

  if (isLoading) {
    return <LoadingView message="Loading library..." />;
  }

  if (!channels) {
    return <ErrorView message="Saved channels are unavailable right now." onRetry={refetch} />;
  }

  const channelsById = new Map<string, Channel>(
    channels.map((channel) => [channel.id, channel]),
  );
  const favoriteChannels = (favorites ?? [])
    .map((favorite) => channelsById.get(favorite.entityRef.entityId))
    .filter((c): c is Channel => c !== undefined);

  const historyChannels = (recentlyWatched ?? [])
    .map((entry) => channelsById.get(entry.entityRef.entityId))
    .filter((c): c is Channel => c !== undefined);

  const summaries = new Map(
    (playlistSummaries ?? []).map((summary) => [summary.playlistId, summary]),
  );
  const playlistChannels = activeItems
    .map((item) => channelsById.get(item.entityRef.entityId))
    .filter((channel): channel is Channel => channel !== undefined);

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) {
      setCreateError('Enter a playlist name.');
      return;
    }

    setCreateError(null);
    try {
      const playlist = await createPlaylist.mutateAsync({ name });
      setNewPlaylistName('');
      setCreateVisible(false);
      setActivePlaylistId(playlist.id);
    } catch {
      setCreateError('Could not create the playlist. Try again.');
    }
  };

  const removeChannel = (playlist: Playlist, channel: Channel) => {
    removePlaylistItem.mutate({
      playlistId: playlist.id,
      entityRef: { entityType: 'channel', entityId: channel.id },
    });
  };

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
            <SectionHeader
              title="Playlists"
              seeAllLabel="Create"
              onSeeAll={() => setCreateVisible(true)}
              style={styles.sectionHeader}
            />
            {playlists && playlists.length > 0 ? (
              <View style={styles.playlistsContainer}>
                {playlists.map((playlist) => {
                  const summary = summaries.get(playlist.id);
                  const previewChannels = (summary?.previewChannelIds ?? [])
                    .map((id) => channelsById.get(id))
                    .filter((channel): channel is Channel => channel !== undefined);

                  return (
                    <PressableCard
                      key={playlist.id}
                      variant="elevated"
                      style={styles.playlistCard}
                      onPress={() => setActivePlaylistId(playlist.id)}
                      accessibilityLabel={`Open ${playlist.name}, ${summary?.channelCount ?? 0} channels`}
                    >
                      <CardContent style={styles.playlistContent}>
                        <View
                          style={[styles.playlistIcon, { backgroundColor: colors.primaryMuted }]}
                        >
                          <SymbolView
                            name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
                            size={20}
                            tintColor={colors.primary}
                          />
                        </View>
                        <View style={styles.playlistText}>
                          <ThemedText numberOfLines={1} style={styles.playlistName}>
                            {playlist.name}
                          </ThemedText>
                          <ThemedText variant="caption" themeColor="textSecondary">
                            {summary?.channelCount ?? 0}{' '}
                            {(summary?.channelCount ?? 0) === 1 ? 'channel' : 'channels'}
                          </ThemedText>
                        </View>
                        <ChannelAvatarStack
                          channels={previewChannels}
                          totalCount={summary?.channelCount ?? previewChannels.length}
                        />
                        <SymbolView
                          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                          size={16}
                          tintColor={colors.textTertiary}
                        />
                      </CardContent>
                    </PressableCard>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  No playlists yet.
                </ThemedText>
                <Button variant="outline" size="sm" onPress={() => setCreateVisible(true)}>
                  <ThemedText themeColor="text">Create a playlist</ThemedText>
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <Modal
        animationType="fade"
        transparent
        visible={createVisible}
        onRequestClose={() => setCreateVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="Close create playlist dialog"
            onPress={() => setCreateVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.createDialog, { backgroundColor: colors.backgroundElevated }]}>
            <ThemedText variant="titleLarge">New playlist</ThemedText>
            <Input
              accessibilityLabel="Playlist name"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              onSubmitEditing={() => void handleCreatePlaylist()}
              returnKeyType="done"
              maxLength={60}
            />
            {createError ? (
              <ThemedText variant="caption" style={{ color: colors.error }}>
                {createError}
              </ThemedText>
            ) : null}
            <View style={styles.createActions}>
              <Button variant="ghost" onPress={() => setCreateVisible(false)}>
                <ThemedText themeColor="text">Cancel</ThemedText>
              </Button>
              <Button
                onPress={() => void handleCreatePlaylist()}
                loading={createPlaylist.isPending}
                disabled={createPlaylist.isPending}
              >
                <ThemedText style={{ color: colors.primaryText }}>Create</ThemedText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      {activePlaylist ? (
        <SlideUpSheet visible onClose={() => setActivePlaylistId(null)}>
          <View style={styles.playlistSheetContent}>
            <View style={styles.playlistSheetHeader}>
              <View style={[styles.playlistIcon, { backgroundColor: colors.primaryMuted }]}>
                <SymbolView
                  name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
                  size={20}
                  tintColor={colors.primary}
                />
              </View>
              <View style={styles.detailHeading}>
                <ThemedText variant="headlineSmall" numberOfLines={1}>
                  {activePlaylist.name}
                </ThemedText>
                <ThemedText variant="bodySmall" themeColor="textSecondary">
                  {playlistChannels.length} {playlistChannels.length === 1 ? 'channel' : 'channels'}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setActivePlaylistId(null)}
                accessibilityRole="button"
                accessibilityLabel="Close playlist details"
                style={styles.closeButton}
              >
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={19}
                  tintColor={colors.textSecondary}
                />
              </Pressable>
            </View>
            {playlistChannels.length > 0 ? (
              <View style={styles.detailPreview}>
                <ChannelAvatarStack channels={playlistChannels} />
              </View>
            ) : null}
            {itemsLoading ? (
              <LoadingView message="Loading playlist..." />
            ) : playlistChannels.length > 0 ? (
              <FlatList
                data={playlistChannels}
                keyExtractor={(channel) => channel.id}
                contentContainerStyle={styles.detailList}
                renderItem={({ item }) => (
                  <PlaylistChannelRow
                    channel={item}
                    onPlay={() =>
                      router.push({
                        pathname: '/player/[channelId]',
                        params: { channelId: item.id },
                      })
                    }
                    onRemove={() => removeChannel(activePlaylist, item)}
                  />
                )}
              />
            ) : (
              <View style={styles.detailEmpty}>
                <SymbolView
                  name={{ ios: 'text.badge.plus', android: 'playlist_add', web: 'playlist_add' }}
                  size={32}
                  tintColor={colors.textTertiary}
                />
                <ThemedText variant="titleSmall">No channels yet</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Add channels from the Channels tab using the playlist button on a channel card.
                </ThemedText>
              </View>
            )}
          </View>
        </SlideUpSheet>
      ) : null}
    </ThemedView>
  );
}

function PlaylistChannelRow({
  channel,
  onPlay,
  onRemove,
}: {
  readonly channel: Channel;
  readonly onPlay: () => void;
  readonly onRemove?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.channelRow,
        { backgroundColor: colors.surface, borderColor: colors.borderMuted },
      ]}
    >
      <Pressable
        onPress={onPlay}
        accessibilityRole="button"
        accessibilityLabel={`Play ${channel.name}`}
        style={styles.channelPlayAction}
      >
        <ChannelLogo
          channel={channel}
          style={[styles.channelLogo, { backgroundColor: colors.backgroundElement }]}
        />
        <View style={styles.channelInfo}>
          <ThemedText numberOfLines={1} variant="titleSmall">
            {channel.name}
          </ThemedText>
          <ThemedText numberOfLines={1} variant="caption" themeColor="textSecondary">
            {channel.country ?? channel.network ?? 'TV channel'}
          </ThemedText>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${channel.name} from playlist`}
          style={styles.removeButton}
          hitSlop={10}
        >
          <SymbolView
            name={{ ios: 'minus.circle', android: 'remove_circle_outline', web: 'remove_circle_outline' }}
            size={21}
            tintColor={colors.textTertiary}
          />
        </Pressable>
      ) : null}
    </View>
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
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  playlistIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistText: {
    flex: 1,
    gap: Spacing.xxs,
  },
  playlistName: {
    fontWeight: '600',
  },
  playlistSheetContent: {
    flex: 1,
  },
  playlistSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  detailHeading: {
    flex: 1,
    gap: Spacing.xxs,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  detailList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  channelRow: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  channelLogo: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  channelInfo: {
    flex: 1,
    gap: Spacing.xxs,
  },
  channelPlayAction: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  removeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  createDialog: {
    width: '100%',
    maxWidth: 440,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
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

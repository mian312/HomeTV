import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radius, Spacing } from '@/constants/theme';
import {
    useAddPlaylistItem,
    useChannelPlaylistMemberships,
    useCreatePlaylist,
    usePlaylists,
    useRemovePlaylistItem,
} from '@/data/queries/local';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';

interface PlaylistPickerProps {
  readonly channel: Channel;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function PlaylistPicker({ channel, visible, onClose }: PlaylistPickerProps) {
  const { colors } = useTheme();
  const { data: playlists = [] } = usePlaylists();
  const { data: memberships = [] } = useChannelPlaylistMemberships(channel.id);
  const createPlaylist = useCreatePlaylist();
  const addItem = useAddPlaylistItem();
  const removeItem = useRemovePlaylistItem();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const entityRef = { entityType: 'channel' as const, entityId: channel.id };

  const togglePlaylist = async (playlistId: string) => {
    setError(null);
    try {
      if (memberships.includes(playlistId)) {
        await removeItem.mutateAsync({ playlistId, entityRef });
      } else {
        await addItem.mutateAsync({ playlistId, entityRef });
      }
    } catch {
      setError('Could not update this playlist. Try again.');
    }
  };

  const createAndAdd = async () => {
    const playlistName = name.trim();
    if (!playlistName) {
      setError('Enter a playlist name.');
      return;
    }

    setError(null);
    try {
      const playlist = await createPlaylist.mutateAsync({ name: playlistName });
      await addItem.mutateAsync({ playlistId: playlist.id, entityRef });
      setName('');
    } catch {
      setError('Could not create the playlist. Try again.');
    }
  };

  const isUpdating = addItem.isPending || removeItem.isPending || createPlaylist.isPending;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close playlist picker"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.backgroundElevated }]}
        >
          <View style={styles.header}>
            <View style={styles.heading}>
              <ThemedText variant="titleLarge">Add to playlist</ThemedText>
              <ThemedText numberOfLines={1} themeColor="textSecondary">
                {channel.name}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={20}
                tintColor={colors.textSecondary}
              />
            </Pressable>
          </View>

          <ScrollView style={styles.playlistList} keyboardShouldPersistTaps="handled">
            {playlists.length > 0 ? (
              playlists.map((playlist) => {
                const selected = memberships.includes(playlist.id);
                return (
                  <Pressable
                    key={playlist.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled: isUpdating }}
                    onPress={() => void togglePlaylist(playlist.id)}
                    disabled={isUpdating}
                    style={({ pressed }) => [
                      styles.playlistRow,
                      { borderBottomColor: colors.borderMuted },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.playlistInfo}>
                      <ThemedText numberOfLines={1} variant="titleSmall">
                        {playlist.name}
                      </ThemedText>
                      <ThemedText variant="caption" themeColor="textSecondary">
                        {playlist.updatedAt.toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <SymbolView
                      name={
                        selected
                          ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                          : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }
                      }
                      size={22}
                      tintColor={selected ? colors.primary : colors.textTertiary}
                    />
                  </Pressable>
                );
              })
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                Create a playlist below to save this channel.
              </ThemedText>
            )}
          </ScrollView>

          <View style={[styles.createSection, { borderTopColor: colors.borderMuted }]}>
            <Input
              accessibilityLabel="New playlist name"
              placeholder="New playlist name"
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              onSubmitEditing={() => void createAndAdd()}
              maxLength={60}
            />
            {error ? (
              <ThemedText variant="caption" style={{ color: colors.error }}>
                {error}
              </ThemedText>
            ) : null}
            <Button
              onPress={() => void createAndAdd()}
              disabled={isUpdating}
              loading={createPlaylist.isPending || addItem.isPending}
              style={styles.createButton}
            >
              <ThemedText style={{ color: colors.primaryText }}>Create and add channel</ThemedText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '86%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heading: {
    flex: 1,
    gap: Spacing.xs,
  },
  playlistList: {
    flexGrow: 0,
    paddingHorizontal: Spacing.lg,
  },
  playlistRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  playlistInfo: {
    flex: 1,
    gap: Spacing.xxs,
  },
  emptyText: {
    paddingVertical: Spacing.md,
  },
  createSection: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  createButton: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.68,
  },
});

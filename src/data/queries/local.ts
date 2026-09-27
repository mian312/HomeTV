import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  favoritesRepository,
  playlistRepository,
  recentlyWatchedRepository,
} from '@/data/repositories';
import type { EntityRef } from '@/types/domain';

const KEYS = {
  favorites: ['local', 'favorites'] as const,
  recentlyWatched: ['local', 'recentlyWatched'] as const,
  playlists: ['local', 'playlists'] as const,
  playlistItems: (playlistId: string) => ['local', 'playlists', playlistId, 'items'] as const,
};

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function useFavorites() {
  return useQuery({
    queryKey: KEYS.favorites,
    queryFn: () => favoritesRepository.getAll(),
  });
}

export function useIsFavorite(entityRef: EntityRef) {
  return useQuery({
    queryKey: [...KEYS.favorites, entityRef.entityId],
    queryFn: () => favoritesRepository.isFavorite(entityRef),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityRef,
      isFavorite,
    }: {
      entityRef: EntityRef;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await favoritesRepository.remove(entityRef);
      } else {
        await favoritesRepository.add(entityRef);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.favorites });
      queryClient.invalidateQueries({
        queryKey: [...KEYS.favorites, variables.entityRef.entityId],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Recently Watched
// ---------------------------------------------------------------------------

export function useRecentlyWatched() {
  return useQuery({
    queryKey: KEYS.recentlyWatched,
    queryFn: () => recentlyWatchedRepository.getAll(),
  });
}

export function useAddRecentlyWatched() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entityRef: EntityRef) => {
      await recentlyWatchedRepository.record(entityRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.recentlyWatched });
    },
  });
}

export function useClearRecentlyWatched() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await recentlyWatchedRepository.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.recentlyWatched });
    },
  });
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export function usePlaylists() {
  return useQuery({
    queryKey: KEYS.playlists,
    queryFn: () => playlistRepository.getAll(),
  });
}

export function usePlaylistSummaries() {
  return useQuery({
    queryKey: [...KEYS.playlists, 'summaries'],
    queryFn: async () => {
      const playlists = await playlistRepository.getAll();
      return Promise.all(
        playlists.map(async (playlist) => {
          const items = await playlistRepository.getItems(playlist.id);
          return {
            playlistId: playlist.id,
            channelCount: items.length,
            previewChannelIds: items.slice(0, 4).map((item) => item.entityRef.entityId),
          };
        }),
      );
    },
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      return playlistRepository.create(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.playlists });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await playlistRepository.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.playlists });
    },
  });
}

export function usePlaylistItems(playlistId: string) {
  return useQuery({
    queryKey: KEYS.playlistItems(playlistId),
    queryFn: () => playlistRepository.getItems(playlistId),
    enabled: !!playlistId,
  });
}

export function useChannelPlaylistMemberships(channelId: string) {
  return useQuery({
    queryKey: [...KEYS.playlists, 'memberships'],
    queryFn: async () => {
      const playlists = await playlistRepository.getAll();
      const itemsByPlaylist = await Promise.all(
        playlists.map(async (playlist) => {
          const items = await playlistRepository.getItems(playlist.id);
          return { playlistId: playlist.id, items };
        }),
      );
      const memberships: Record<string, string[]> = {};
      for (const { playlistId, items } of itemsByPlaylist) {
        for (const item of items) {
          const channelMemberships = memberships[item.entityRef.entityId] ?? [];
          channelMemberships.push(playlistId);
          memberships[item.entityRef.entityId] = channelMemberships;
        }
      }
      return memberships;
    },
    select: (memberships) => memberships[channelId] ?? [],
  });
}

export function useAddPlaylistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, entityRef }: { playlistId: string; entityRef: EntityRef }) => {
      await playlistRepository.addItem(playlistId, entityRef);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.playlistItems(variables.playlistId) });
      queryClient.invalidateQueries({ queryKey: [...KEYS.playlists, 'memberships'] });
      queryClient.invalidateQueries({ queryKey: [...KEYS.playlists, 'summaries'] });
    },
  });
}

export function useRemovePlaylistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, entityRef }: { playlistId: string; entityRef: EntityRef }) => {
      await playlistRepository.removeItem(playlistId, entityRef);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.playlistItems(variables.playlistId) });
      queryClient.invalidateQueries({ queryKey: [...KEYS.playlists, 'memberships'] });
      queryClient.invalidateQueries({ queryKey: [...KEYS.playlists, 'summaries'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  favoritesRepository,
  playlistRepository,
  recentlyWatchedRepository,
} from '@/data/repositories';
import { useSessionStore } from '@/stores/session';
import type { EntityRef, ProfileId } from '@/types/domain';

const KEYS = {
  favorites: (profileId: ProfileId) => ['local', 'favorites', profileId] as const,
  recentlyWatched: (profileId: ProfileId) => ['local', 'recentlyWatched', profileId] as const,
  playlists: (profileId: ProfileId) => ['local', 'playlists', profileId] as const,
  playlistItems: (profileId: ProfileId, playlistId: string) => ['local', 'playlists', profileId, playlistId, 'items'] as const,
  playlistSummaries: (profileId: ProfileId) => ['local', 'playlists', profileId, 'summaries'] as const,
  playlistMemberships: (profileId: ProfileId) => ['local', 'playlists', profileId, 'memberships'] as const,
};

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function useFavorites() {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.favorites(profileId) : [],
    queryFn: () => favoritesRepository.getAll(profileId!),
    enabled: !!profileId,
  });
}

export function useIsFavorite(entityRef: EntityRef) {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.favorites(profileId) : [],
    queryFn: () => favoritesRepository.getAll(profileId!),
    enabled: !!profileId,
    select: (favorites) =>
      favorites.some(
        (favorite) =>
          favorite.entityRef.entityType === entityRef.entityType &&
          favorite.entityRef.entityId === entityRef.entityId,
      ),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async ({
      entityRef,
      isFavorite,
    }: {
      entityRef: EntityRef;
      isFavorite: boolean;
    }) => {
      if (!profileId) throw new Error('No active profile');
      if (isFavorite) {
        await favoritesRepository.remove(profileId, entityRef);
      } else {
        await favoritesRepository.add(profileId, entityRef);
      }
    },
    onSuccess: () => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.favorites(profileId) });
        queryClient.invalidateQueries({ queryKey: ['personalization', profileId] });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Recently Watched
// ---------------------------------------------------------------------------

export function useRecentlyWatched() {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.recentlyWatched(profileId) : [],
    queryFn: () => recentlyWatchedRepository.getAll(profileId!),
    enabled: !!profileId,
  });
}

export function useAddRecentlyWatched() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async (entityRef: EntityRef) => {
      if (!profileId) return; // Ignore if no profile
      await recentlyWatchedRepository.record(profileId, entityRef);
    },
    onSuccess: () => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.recentlyWatched(profileId) });
        queryClient.invalidateQueries({ queryKey: ['personalization', profileId] });
      }
    },
  });
}

export function useClearRecentlyWatched() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error('No active profile');
      await recentlyWatchedRepository.clear(profileId);
    },
    onSuccess: () => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.recentlyWatched(profileId) });
        queryClient.invalidateQueries({ queryKey: ['personalization', profileId] });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export function usePlaylists() {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.playlists(profileId) : [],
    queryFn: () => playlistRepository.getAll(profileId!),
    enabled: !!profileId,
  });
}

export function usePlaylistSummaries() {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.playlistSummaries(profileId) : [],
    queryFn: async () => {
      const playlists = await playlistRepository.getAll(profileId!);
      return Promise.all(
        playlists.map(async (playlist) => {
          const items = await playlistRepository.getItems(profileId!, playlist.id);
          return {
            playlistId: playlist.id,
            channelCount: items.length,
            previewChannelIds: items.slice(0, 4).map((item) => item.entityRef.entityId),
          };
        }),
      );
    },
    enabled: !!profileId,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!profileId) throw new Error('No active profile');
      return playlistRepository.create(profileId, name);
    },
    onSuccess: () => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.playlists(profileId) });
      }
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profileId) throw new Error('No active profile');
      await playlistRepository.delete(profileId, id);
    },
    onSuccess: () => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.playlists(profileId) });
        queryClient.invalidateQueries({ queryKey: KEYS.playlistSummaries(profileId) });
        queryClient.invalidateQueries({ queryKey: KEYS.playlistMemberships(profileId) });
      }
    },
  });
}

export function usePlaylistItems(playlistId: string) {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.playlistItems(profileId, playlistId) : [],
    queryFn: () => playlistRepository.getItems(profileId!, playlistId),
    enabled: !!profileId && !!playlistId,
  });
}

export function useChannelPlaylistMemberships(channelId: string) {
  const profileId = useSessionStore((state) => state.activeProfile?.id);
  return useQuery({
    queryKey: profileId ? KEYS.playlistMemberships(profileId) : [],
    queryFn: async () => {
      const playlists = await playlistRepository.getAll(profileId!);
      const itemsByPlaylist = await Promise.all(
        playlists.map(async (playlist) => {
          const items = await playlistRepository.getItems(profileId!, playlist.id);
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
    enabled: !!profileId && !!channelId,
  });
}

export function useAddPlaylistItem() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async ({ playlistId, entityRef }: { playlistId: string; entityRef: EntityRef }) => {
      if (!profileId) throw new Error('No active profile');
      await playlistRepository.addItem(profileId, playlistId, entityRef);
    },
    onSuccess: (_, variables) => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.playlistItems(profileId, variables.playlistId) });
        queryClient.invalidateQueries({ queryKey: KEYS.playlistMemberships(profileId) });
        queryClient.invalidateQueries({ queryKey: KEYS.playlistSummaries(profileId) });
      }
    },
  });
}

export function useRemovePlaylistItem() {
  const queryClient = useQueryClient();
  const profileId = useSessionStore((state) => state.activeProfile?.id);

  return useMutation({
    mutationFn: async ({ playlistId, entityRef }: { playlistId: string; entityRef: EntityRef }) => {
      if (!profileId) throw new Error('No active profile');
      await playlistRepository.removeItem(profileId, playlistId, entityRef);
    },
    onSuccess: (_, variables) => {
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: KEYS.playlistItems(profileId, variables.playlistId) });
        queryClient.invalidateQueries({ queryKey: KEYS.playlistMemberships(profileId) });
        queryClient.invalidateQueries({ queryKey: KEYS.playlistSummaries(profileId) });
      }
    },
  });
}

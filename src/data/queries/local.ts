import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  favoritesRepository,
  recentlyWatchedRepository,
  playlistRepository,
} from '@/data/repositories';
import type { PlaylistItem, EntityRef } from '@/types/domain';

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
      queryClient.invalidateQueries({ queryKey: [...KEYS.favorites, variables.entityRef.entityId] });
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

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      await playlistRepository.create(name);
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

export function useAddPlaylistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      entityRef,
    }: {
      playlistId: string;
      entityRef: EntityRef;
    }) => {
      await playlistRepository.addItem(playlistId, entityRef);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.playlistItems(variables.playlistId) });
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
    },
  });
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import React from 'react';

import { useSessionStore } from '@/stores/session';
import { useFavorites, useRecentlyWatched, usePlaylists } from '@/data/queries/local';
import { favoritesRepository, recentlyWatchedRepository, playlistRepository } from '@/data/repositories';
import type { Favorite, RecentlyWatchedEntry, Playlist, ProfileId } from '@/types/domain';

jest.mock('@/data/repositories', () => ({
  favoritesRepository: { getAll: jest.fn() },
  recentlyWatchedRepository: { getAll: jest.fn() },
  playlistRepository: { getAll: jest.fn() },
}));

const mockGetAllFavorites = jest.mocked(favoritesRepository.getAll);
const mockGetAllRecentlyWatched = jest.mocked(recentlyWatchedRepository.getAll);
const mockGetAllPlaylists = jest.mocked(playlistRepository.getAll);

describe('Profile Isolation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('provides isolated query keys for different profiles', async () => {
    const profileA = 'profile-a' as ProfileId;
    const profileB = 'profile-b' as ProfileId;

    mockGetAllFavorites.mockImplementation(async (id) => {
      if (id === profileA) return [{ entityRef: { entityType: 'channel', entityId: 'c1' }, createdAt: new Date() }] as unknown as Favorite[];
      if (id === profileB) return [{ entityRef: { entityType: 'channel', entityId: 'c2' }, createdAt: new Date() }] as unknown as Favorite[];
      return [];
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Profile A
    act(() => {
      useSessionStore.setState({ activeProfile: { id: profileA } as any, phase: 'ready' });
    });
    const { result, rerender } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].entityRef.entityId).toBe('c1');
    expect(mockGetAllFavorites).toHaveBeenCalledWith(profileA);
    mockGetAllFavorites.mockClear();

    // Switch to Profile B
    act(() => {
      useSessionStore.setState({ activeProfile: { id: profileB } as any, phase: 'ready' });
    });
    rerender({}); // Force re-render of the hook to pick up new session state

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].entityRef.entityId).toBe('c2');
    expect(mockGetAllFavorites).toHaveBeenCalledWith(profileB);
  });

  it('provides isolated query keys for recently watched', async () => {
    const profileA = 'profile-a' as ProfileId;
    const profileB = 'profile-b' as ProfileId;

    mockGetAllRecentlyWatched.mockImplementation(async (id) => {
      if (id === profileA) return [{ entityRef: { entityType: 'channel', entityId: 'c1' }, watchedAt: new Date() }] as unknown as RecentlyWatchedEntry[];
      if (id === profileB) return [{ entityRef: { entityType: 'channel', entityId: 'c2' }, watchedAt: new Date() }] as unknown as RecentlyWatchedEntry[];
      return [];
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    act(() => {
      useSessionStore.setState({ activeProfile: { id: profileA } as any, phase: 'ready' });
    });
    const { result, rerender } = renderHook(() => useRecentlyWatched(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].entityRef.entityId).toBe('c1');
    expect(mockGetAllRecentlyWatched).toHaveBeenCalledWith(profileA);
    mockGetAllRecentlyWatched.mockClear();

    act(() => {
      useSessionStore.setState({ activeProfile: { id: profileB } as any, phase: 'ready' });
    });
    rerender({}); 

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].entityRef.entityId).toBe('c2');
    expect(mockGetAllRecentlyWatched).toHaveBeenCalledWith(profileB);
  });

  it('provides isolated query keys for playlists', async () => {
    const profileA = 'profile-a' as ProfileId;
    const profileB = 'profile-b' as ProfileId;

    mockGetAllPlaylists.mockImplementation(async (id) => {
      if (id === profileA) return [{ id: 'p1', name: 'Playlist A' }] as unknown as Playlist[];
      if (id === profileB) return [{ id: 'p2', name: 'Playlist B' }] as unknown as Playlist[];
      return [];
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    act(() => {
      useSessionStore.setState({ activeProfile: { id: profileA } as any, phase: 'ready' });
    });
    const { result, rerender } = renderHook(() => usePlaylists(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].id).toBe('p1');
    expect(mockGetAllPlaylists).toHaveBeenCalledWith(profileA);
    mockGetAllPlaylists.mockClear();

    act(() => {
      useSessionStore.setState({ activeProfile: { id: profileB } as any, phase: 'ready' });
    });
    rerender({}); 

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].id).toBe('p2');
    expect(mockGetAllPlaylists).toHaveBeenCalledWith(profileB);
  });
});

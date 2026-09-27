import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useIsFavorite } from '@/data/queries/local';
import { favoritesRepository } from '@/data/repositories';
import type { Favorite } from '@/types/domain';

jest.mock('@/data/repositories', () => ({
  favoritesRepository: { getAll: jest.fn() },
  playlistRepository: {},
  recentlyWatchedRepository: {},
}));

const mockGetAllFavorites = jest.mocked(favoritesRepository.getAll);

describe('useIsFavorite', () => {
  it('shares one SQLite-backed favorites query between channel cards', async () => {
    const favoriteRef = { entityType: 'channel' as const, entityId: 'channel-a' };
    const favorites: readonly Favorite[] = [
      { entityRef: favoriteRef, createdAt: new Date(0) },
    ];
    mockGetAllFavorites.mockResolvedValue(favorites);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => ({
        favorite: useIsFavorite(favoriteRef),
        notFavorite: useIsFavorite({ entityType: 'channel', entityId: 'channel-b' }),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.favorite.data).toBe(true);
      expect(result.current.notFavorite.data).toBe(false);
    });
    expect(mockGetAllFavorites).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
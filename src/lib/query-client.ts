/**
 * TanStack Query client configuration for HomeTV.
 *
 * This is the single query client used throughout the application.
 * Feature-specific query keys and options are defined alongside their
 * feature hooks, not here.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale time for IPTV catalog data (5 minutes).
 * Individual queries can override this with their own staleTime.
 */
const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Default garbage-collection time (30 minutes).
 * Cached data is kept in memory for this long after all observers unmount.
 */
const DEFAULT_GC_TIME_MS = 30 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

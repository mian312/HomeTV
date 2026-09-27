import { useQuery } from '@tanstack/react-query';

import { defaultProvider } from '../providers';
import type { ChannelId } from '@/types/domain';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const iptvKeys = {
  all: ['iptv'] as const,
  channels: () => [...iptvKeys.all, 'channels'] as const,
  categories: () => [...iptvKeys.all, 'categories'] as const,
  countries: () => [...iptvKeys.all, 'countries'] as const,
  languages: () => [...iptvKeys.all, 'languages'] as const,
  streams: (channelId: ChannelId) => [...iptvKeys.all, 'streams', channelId] as const,
  allStreams: () => [...iptvKeys.all, 'streams', 'all'] as const,
  guide: (channelId: ChannelId) => [...iptvKeys.all, 'guide', channelId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useChannels() {
  return useQuery({
    queryKey: iptvKeys.channels(),
    queryFn: () => defaultProvider.getChannels(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (data changes rarely)
  });
}

export function useCategories() {
  return useQuery({
    queryKey: iptvKeys.categories(),
    queryFn: () => defaultProvider.getCategories(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: iptvKeys.countries(),
    queryFn: () => defaultProvider.getCountries(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: iptvKeys.languages(),
    queryFn: () => defaultProvider.getLanguages(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useStreams(channelId: ChannelId) {
  return useQuery({
    queryKey: iptvKeys.streams(channelId),
    queryFn: () => defaultProvider.getStreams(channelId),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!channelId,
  });
}

export function useAllStreams() {
  return useQuery({
    queryKey: iptvKeys.allStreams(),
    queryFn: () => defaultProvider.getAllStreams(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useGuide(channelId: ChannelId) {
  return useQuery({
    queryKey: iptvKeys.guide(channelId),
    queryFn: () => defaultProvider.getGuide(channelId),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!channelId,
  });
}

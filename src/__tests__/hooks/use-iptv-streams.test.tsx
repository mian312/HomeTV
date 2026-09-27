import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { defaultProvider } from '@/data/providers';
import { useStreams } from '@/data/queries/iptv';
import type { Stream } from '@/types/domain';

jest.mock('@/data/providers', () => ({
  defaultProvider: { getAllStreams: jest.fn() },
}));

const mockGetAllStreams = jest.mocked(defaultProvider.getAllStreams);
const streams: readonly Stream[] = [
  {
    channelId: 'channel-a' as Stream['channelId'],
    url: 'https://example.com/a.m3u8',
    httpReferrer: null,
    userAgent: null,
  },
  {
    channelId: 'channel-b' as Stream['channelId'],
    url: 'https://example.com/b.m3u8',
    httpReferrer: null,
    userAgent: null,
  },
];

describe('useStreams', () => {
  it('shares the all-streams network query while selecting per channel', async () => {
    mockGetAllStreams.mockResolvedValue(streams);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => ({
        first: useStreams('channel-a' as Stream['channelId']),
        second: useStreams('channel-b' as Stream['channelId']),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.first.data?.map((stream) => stream.channelId)).toEqual(['channel-a']);
      expect(result.current.second.data?.map((stream) => stream.channelId)).toEqual(['channel-b']);
    });
    expect(mockGetAllStreams).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
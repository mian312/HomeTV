import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNetInfo } from '@react-native-community/netinfo';
import { useVideoPlayer } from 'expo-video';

import { useStreams } from '@/data/queries/iptv';
import { useAddRecentlyWatched } from '@/data/queries/local';
import { usePlayerSession } from '@/features/player/use-player-session';
import type { Stream } from '@/types/domain';

jest.mock('@react-native-community/netinfo', () => ({ useNetInfo: jest.fn() }));
jest.mock('expo-video', () => ({ useVideoPlayer: jest.fn() }));
jest.mock('@/data/queries/iptv', () => ({ useStreams: jest.fn() }));
jest.mock('@/data/queries/local', () => ({ useAddRecentlyWatched: jest.fn() }));

const listeners = new Map<string, (payload: unknown) => void>();
const mockPlayer = {
  timeUpdateEventInterval: 0,
  keepScreenOnWhilePlaying: false,
  currentTime: 0,
  volume: 1,
  status: 'idle',
  isLive: false,
  addListener: jest.fn((name: string, callback: (...args: never[]) => void) => {
    listeners.set(name, callback as (payload: unknown) => void);
    return { remove: jest.fn() };
  }),
  replaceAsync: jest.fn(() => Promise.resolve()),
  play: jest.fn(),
  pause: jest.fn(),
  seekBy: jest.fn(),
};

const mockUseNetInfo = jest.mocked(useNetInfo);
const mockUseVideoPlayer = jest.mocked(useVideoPlayer);
const mockUseStreams = jest.mocked(useStreams);
const mockUseAddRecentlyWatched = jest.mocked(useAddRecentlyWatched);
const recordRecentlyWatched = jest.fn();
const streams: readonly Stream[] = [
  {
    channelId: 'test-channel' as Stream['channelId'],
    url: 'https://one.example/live.m3u8',
    httpReferrer: null,
    userAgent: null,
  },
  {
    channelId: 'test-channel' as Stream['channelId'],
    url: 'https://two.example/live.m3u8',
    httpReferrer: null,
    userAgent: null,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  listeners.clear();
  mockPlayer.currentTime = 0;
  mockPlayer.volume = 1;
  mockPlayer.status = 'idle';
  mockUseNetInfo.mockReturnValue({ isConnected: true, isInternetReachable: true } as never);
  mockUseVideoPlayer.mockImplementation((_, setup) => {
    setup?.(mockPlayer as never);
    return mockPlayer as never;
  });
  mockUseStreams.mockReturnValue({
    data: streams,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  mockUseAddRecentlyWatched.mockReturnValue({ mutate: recordRecentlyWatched } as never);
});

describe('usePlayerSession', () => {
  it('automatically replaces a failed stream with the next alternate', async () => {
    renderHook(() => usePlayerSession('test-channel' as Stream['channelId']));
    await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenCalledTimes(1));

    act(() => {
      listeners.get('statusChange')?.({ status: 'error', error: { message: 'Unavailable' } });
    });

    await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenCalledTimes(2));
    expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ uri: streams[1].url }),
    );
  });

  it('does not start stream requests while the device is offline', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false, isInternetReachable: false } as never);
    const { result } = renderHook(() => usePlayerSession('test-channel' as Stream['channelId']));

    expect(mockPlayer.replaceAsync).not.toHaveBeenCalled();
    expect(result.current.isOffline).toBe(true);
  });

  it('records recently watched only once after playback actually starts', () => {
    renderHook(() => usePlayerSession('test-channel' as Stream['channelId']));
    const playingListener = listeners.get('playingChange');

    act(() => {
      playingListener?.({ isPlaying: true });
      playingListener?.({ isPlaying: true });
    });

    expect(recordRecentlyWatched).toHaveBeenCalledTimes(1);
    expect(recordRecentlyWatched).toHaveBeenCalledWith({
      entityType: 'channel',
      entityId: 'test-channel',
    });
  });
});

import { useNetInfo } from '@react-native-community/netinfo';
import type { VideoPlayerStatus } from 'expo-video';
import { useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useStreams } from '@/data/queries/iptv';
import { useAddRecentlyWatched } from '@/data/queries/local';
import type { ChannelId } from '@/types/domain';
import { createVideoSource } from './player-source';
import { getNextStreamIndex } from './stream-fallback';

export function usePlayerSession(channelId: ChannelId) {
  const {
    data: streams = [],
    isLoading: isLoadingStreams,
    isError: isStreamsError,
    refetch: refetchStreams,
  } = useStreams(channelId);
  const network = useNetInfo();
  const isOffline = network.isConnected === false || network.isInternetReachable === false;
  const [streamIndex, setStreamIndex] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const [status, setStatus] = useState<VideoPlayerStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const handledFailure = useRef<number | null>(null);
  const recordedChannelId = useRef<ChannelId | null>(null);
  const { mutate: recordRecentlyWatched } = useAddRecentlyWatched();

  const player = useVideoPlayer(null, (instance) => {
    instance.timeUpdateEventInterval = 0.5;
    instance.keepScreenOnWhilePlaying = true;
  });
  const playerRef = useRef(player);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current.currentTime = seconds;
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    const activePlayer = playerRef.current;
    activePlayer.volume = Math.max(0, Math.min(1, activePlayer.volume + delta));
    return activePlayer.volume;
  }, []);

  const handleStreamFailure = useCallback(
    (failedIndex: number, message: string) => {
      if (handledFailure.current === failedIndex) return;
      handledFailure.current = failedIndex;
      setPlayerError(message);

      const nextIndex = getNextStreamIndex(failedIndex, streams.length);
      if (!isOffline && nextIndex !== null) {
        setStreamIndex(nextIndex);
        setPlayerError(`Stream ${failedIndex + 1} failed. Trying backup stream...`);
      }
    },
    [isOffline, streams.length],
  );

  useEffect(() => {
    const statusSubscription = player.addListener(
      'statusChange',
      ({ status: nextStatus, error }) => {
        setStatus(nextStatus);
        if (nextStatus === 'readyToPlay') {
          setPlayerError(null);
        } else if (nextStatus === 'error') {
          handleStreamFailure(streamIndex, error?.message ?? 'This stream could not be played.');
        }
      },
    );
    const playingSubscription = player.addListener(
      'playingChange',
      ({ isPlaying: nextPlaying }) => {
        setIsPlaying(nextPlaying);
        if (nextPlaying && recordedChannelId.current !== channelId) {
          recordedChannelId.current = channelId;
          recordRecentlyWatched({ entityType: 'channel', entityId: channelId });
        }
      },
    );
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime: nextTime }) => {
      setCurrentTime(nextTime);
    });
    const sourceSubscription = player.addListener('sourceLoad', ({ duration: nextDuration }) => {
      setDuration(nextDuration);
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      timeSubscription.remove();
      sourceSubscription.remove();
    };
  }, [channelId, handleStreamFailure, player, recordRecentlyWatched, streamIndex]);

  useEffect(() => {
    if (isLoadingStreams || isOffline || streams.length === 0 || streamIndex >= streams.length) {
      return;
    }

    let active = true;
    handledFailure.current = null;

    void player
      .replaceAsync(createVideoSource(streams[streamIndex]))
      .then(() => {
        if (active) player.play();
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'This stream could not be played.';
        handleStreamFailure(streamIndex, message);
      });

    return () => {
      active = false;
    };
  }, [handleStreamFailure, isLoadingStreams, isOffline, player, retryToken, streamIndex, streams]);

  const retry = useCallback(() => {
    setPlayerError(null);
    if (isStreamsError) {
      void refetchStreams();
      return;
    }
    handledFailure.current = null;
    setStreamIndex(0);
    setRetryToken((token) => token + 1);
  }, [isStreamsError, refetchStreams]);

  const tryNextStream = useCallback(() => {
    if (streams.length === 0) return;
    handledFailure.current = null;
    setPlayerError(null);
    setStreamIndex((index) => (index + 1 < streams.length ? index + 1 : 0));
    setRetryToken((token) => token + 1);
  }, [streams.length]);

  return {
    player,
    streams,
    streamIndex,
    streamCount: streams.length,
    status,
    isPlaying,
    isLive: player.isLive,
    isOffline,
    isLoadingStreams,
    isStreamsError,
    playerError,
    currentTime,
    duration,
    seekTo,
    adjustVolume,
    retry,
    tryNextStream,
  };
}

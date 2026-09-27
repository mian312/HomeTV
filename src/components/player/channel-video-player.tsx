import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SymbolView } from 'expo-symbols';
import { VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    PanResponder,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { getDoubleTapSeekSeconds, getPlayerGestureAction } from '@/features/player/player-gestures';
import { usePlayerSession } from '@/features/player/use-player-session';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';

interface ChannelVideoPlayerProps {
  readonly channel: Channel;
}

type TapSide = 'left' | 'right';

export function ChannelVideoPlayer({ channel }: ChannelVideoPlayerProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const session = usePlayerSession(channel.id);
  const videoRef = useRef<VideoView>(null);
  const lastTap = useRef<Record<TapSide, number>>({ left: 0, right: 0 });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [gestureMessage, setGestureMessage] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      () => undefined,
    );
    return () => {
      void ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  const setGestureFeedback = useCallback((message: string) => {
    setControlsVisible(true);
    setGestureMessage(message);
    setTimeout(() => setGestureMessage(null), 900);
  }, []);

  const [gestureResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 18 || Math.abs(gesture.dy) > 18,
      onPanResponderRelease: (_, gesture) => {
        const action = getPlayerGestureAction(gesture.dx, gesture.dy);
        if (!action) return;
        if (action.type === 'seek') {
          session.player.seekBy(action.seconds);
          setGestureFeedback(`${action.seconds > 0 ? '+' : ''}${action.seconds}s`);
        } else {
          const nextVolume = session.adjustVolume(action.delta);
          setGestureFeedback(`Volume ${Math.round(nextVolume * 100)}%`);
        }
      },
    }),
  );

  const handleVideoTap = (side: TapSide) => {
    const now = Date.now();
    const previousTap = lastTap.current[side];
    lastTap.current[side] = now;
    const seconds = getDoubleTapSeekSeconds(side, now - previousTap);

    if (seconds !== null) {
      session.player.seekBy(seconds);
      setGestureFeedback(`${seconds > 0 ? '+' : ''}${seconds}s`);
      lastTap.current[side] = 0;
      return;
    }
    setControlsVisible((visible) => !visible);
  };

  const enterFullscreen = async () => {
    try {
      if (Platform.OS !== 'web') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
      await videoRef.current?.enterFullscreen();
    } catch {
      if (Platform.OS !== 'web') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
          () => undefined,
        );
      }
      setGestureFeedback('Could not enter fullscreen');
    }
  };

  const restorePortrait = async () => {
    if (Platform.OS !== 'web') {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
        () => undefined,
      );
    }
  };

  const exitFullscreen = async () => {
    try {
      await videoRef.current?.exitFullscreen();
    } finally {
      await restorePortrait();
    }
  };

  const handleSeekBarPress = (locationX: number) => {
    if (session.duration <= 0 || progressWidth <= 0) return;
    session.seekTo((locationX / progressWidth) * session.duration);
  };

  const isOffline = session.isOffline;
  const noStreams =
    !session.isLoadingStreams && !session.isStreamsError && session.streams.length === 0;
  const showLoading = session.isLoadingStreams || session.status === 'loading';
  const showPlayerIssue =
    isOffline || session.isStreamsError || noStreams || (!!session.playerError && !showLoading);
  const progress =
    session.duration > 0 ? Math.max(0, Math.min(1, session.currentTime / session.duration)) : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.playerBackground }]}>
      <VideoView
        ref={videoRef}
        player={session.player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        fullscreenOptions={{ enable: true }}
        onFullscreenEnter={() => setIsFullscreen(true)}
        onFullscreenExit={() => {
          setIsFullscreen(false);
          void restorePortrait();
        }}
      />

      <View style={StyleSheet.absoluteFill} {...gestureResponder.panHandlers}>
        <Pressable
          onPress={() => handleVideoTap('left')}
          style={styles.leftGestureZone}
          accessibilityLabel="Player left gesture area"
        />
        <Pressable
          onPress={() => handleVideoTap('right')}
          style={styles.rightGestureZone}
          accessibilityLabel="Player right gesture area"
        />

        {controlsVisible ? (
          <SafeAreaView
            pointerEvents="box-none"
            style={styles.overlay}
            edges={['top', 'left', 'right', 'bottom']}
          >
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.back()}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Close player"
              >
                <SymbolView name="chevron.left" size={22} tintColor={colors.playerText} />
              </Pressable>
              <View style={styles.channelTitle}>
                <ThemedText
                  variant="titleSmall"
                  numberOfLines={1}
                  style={{ color: colors.playerText }}
                >
                  {channel.name}
                </ThemedText>
                <ThemedText variant="caption" style={{ color: colors.playerControlMuted }}>
                  {channel.country ?? 'Live TV'}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <SymbolView
                  name={
                    isFullscreen
                      ? 'arrow.down.right.and.arrow.up.left'
                      : 'arrow.up.left.and.arrow.down.right'
                  }
                  size={20}
                  tintColor={colors.playerText}
                />
              </Pressable>
            </View>

            <View style={styles.centerFeedback} pointerEvents="none">
              {gestureMessage ? (
                <View style={styles.feedbackPill}>
                  <ThemedText variant="titleSmall" style={{ color: colors.playerText }}>
                    {gestureMessage}
                  </ThemedText>
                </View>
              ) : null}
              {showLoading ? (
                <View style={styles.feedbackPill}>
                  <ActivityIndicator color={colors.playerText} />
                  <ThemedText variant="bodySmall" style={{ color: colors.playerText }}>
                    {session.streamIndex > 0
                      ? `Trying backup stream ${session.streamIndex + 1} of ${session.streamCount}`
                      : 'Connecting to stream...'}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.bottomPanel}>
              {showPlayerIssue ? (
                <PlayerIssue
                  title={
                    isOffline
                      ? 'You are offline'
                      : session.isStreamsError
                        ? 'Could not load streams'
                        : noStreams
                          ? 'No playable streams are available'
                          : 'Stream unavailable'
                  }
                  message={
                    isOffline
                      ? 'Check your connection and try again.'
                      : (session.playerError ?? 'Try again or move to another available stream.')
                  }
                  onRetry={session.retry}
                  onNext={session.streamCount > 1 ? session.tryNextStream : undefined}
                />
              ) : null}

              <View style={styles.controlsRow}>
                <Pressable
                  onPress={() => session.player.seekBy(-10)}
                  style={styles.controlButton}
                  accessibilityRole="button"
                  accessibilityLabel="Back 10 seconds"
                >
                  <SymbolView name="gobackward.10" size={25} tintColor={colors.playerText} />
                </Pressable>
                <Pressable
                  onPress={() =>
                    session.isPlaying ? session.player.pause() : session.player.play()
                  }
                  style={[styles.playButton, { backgroundColor: colors.playerText }]}
                  accessibilityRole="button"
                  accessibilityLabel={session.isPlaying ? 'Pause' : 'Play'}
                >
                  <SymbolView
                    name={session.isPlaying ? 'pause.fill' : 'play.fill'}
                    size={23}
                    tintColor={colors.playerBackground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => session.player.seekBy(10)}
                  style={styles.controlButton}
                  accessibilityRole="button"
                  accessibilityLabel="Forward 10 seconds"
                >
                  <SymbolView name="goforward.10" size={25} tintColor={colors.playerText} />
                </Pressable>
                {session.streamCount > 1 ? (
                  <ThemedText variant="caption" style={styles.streamCount}>
                    {session.streamIndex + 1}/{session.streamCount}
                  </ThemedText>
                ) : null}
              </View>

              {session.duration > 0 ? (
                <View style={styles.timeline}>
                  <ThemedText variant="caption" style={styles.timecode}>
                    {formatTime(session.currentTime)}
                  </ThemedText>
                  <Pressable
                    onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
                    onPress={(event) => handleSeekBarPress(event.nativeEvent.locationX)}
                    style={[styles.progressTrack, { backgroundColor: colors.playerControlMuted }]}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Playback position"
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${progress * 100}%` },
                      ]}
                    />
                  </Pressable>
                  <ThemedText variant="caption" style={styles.timecode}>
                    {formatTime(session.duration)}
                  </ThemedText>
                </View>
              ) : session.isLive ? (
                <ThemedText
                  variant="caption"
                  style={[styles.liveLabel, { color: colors.playerText }]}
                >
                  LIVE
                </ThemedText>
              ) : null}
            </View>
          </SafeAreaView>
        ) : null}
      </View>
    </View>
  );
}

function PlayerIssue({
  title,
  message,
  onRetry,
  onNext,
}: {
  readonly title: string;
  readonly message: string;
  readonly onRetry: () => void;
  readonly onNext?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.issue, { backgroundColor: colors.overlay }]}>
      <ThemedText variant="titleSmall" style={{ color: colors.playerText }}>
        {title}
      </ThemedText>
      <ThemedText variant="caption" style={{ color: colors.playerControlMuted }}>
        {message}
      </ThemedText>
      <View style={styles.issueActions}>
        <Button size="sm" variant="secondary" onPress={onRetry}>
          <ThemedText themeColor="text">Retry</ThemedText>
        </Button>
        {onNext ? (
          <Button size="sm" variant="outline" onPress={onNext}>
            <ThemedText style={{ color: colors.playerText }}>Try another stream</ThemedText>
          </Button>
        ) : null}
      </View>
    </View>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remaining}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  leftGestureZone: {
    position: 'absolute',
    left: 0,
    top: 64,
    bottom: 94,
    width: '44%',
  },
  rightGestureZone: {
    position: 'absolute',
    right: 0,
    top: 64,
    bottom: 94,
    width: '44%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  channelTitle: {
    flex: 1,
    gap: Spacing.xxs,
  },
  centerFeedback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  bottomPanel: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  issue: {
    alignSelf: 'center',
    maxWidth: 520,
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  issueActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  controlsRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  streamCount: {
    position: 'absolute',
    right: Spacing.xs,
    color: 'white',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timecode: {
    minWidth: 40,
    color: 'white',
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
  },
  liveLabel: {
    alignSelf: 'flex-end',
    fontWeight: '700',
  },
});

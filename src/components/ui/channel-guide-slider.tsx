import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useGuide } from '@/data/queries/iptv';
import { useTheme } from '@/hooks/use-theme';
import type { Channel, GuideEntry } from '@/types/domain';
import { ChannelLogo } from './channel-logo';
import { SlideUpSheet } from './slide-up-sheet';

type GuideRange = 'day' | 'past' | 'future';

interface ChannelGuideSliderProps {
  readonly channel: Channel;
  readonly onClose: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const ranges: readonly { id: GuideRange; label: string }[] = [
  { id: 'day', label: 'Next 24 hours' },
  { id: 'past', label: 'Past 3 days' },
  { id: 'future', label: 'Next 7 days' },
];

export function ChannelGuideSlider({ channel, onClose }: ChannelGuideSliderProps) {
  const { data: guide, isLoading, isError, refetch } = useGuide(channel.id);
  const { colors } = useTheme();
  const [range, setRange] = useState<GuideRange>('day');
  const [now] = useState(() => Date.now());
  const start = range === 'past' ? now - 3 * DAY_MS : now;
  const end = range === 'past' ? now : now + (range === 'day' ? DAY_MS : 7 * DAY_MS);
  const entries = (guide ?? []).filter((entry) => {
    if (range === 'past') {
      return (
        entry.start.getTime() < now && entry.end.getTime() <= now && entry.end.getTime() > start
      );
    }
    return entry.end.getTime() > start && entry.start.getTime() < end;
  });

  return (
    <SlideUpSheet visible onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.channelHeading}>
            <ChannelLogo channel={channel} style={styles.logo} />
            <View style={styles.titleGroup}>
              <ThemedText variant="headlineSmall" numberOfLines={1}>
                {channel.name}
              </ThemedText>
              <ThemedText variant="caption" themeColor="textSecondary">
                TV guide
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close channel guide"
            style={styles.closeButton}
          >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={19}
                tintColor={colors.textSecondary}
              />
          </Pressable>
        </View>

        <View style={[styles.rangeControl, { backgroundColor: colors.backgroundElement }]}>
          {ranges.map((option) => {
            const selected = range === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setRange(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                testID={`guide-range-${option.id}`}
                style={[styles.rangeOption, selected && { backgroundColor: colors.primary }]}
              >
                <ThemedText
                  variant="caption"
                  numberOfLines={1}
                  style={{ color: selected ? colors.primaryText : colors.textSecondary }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.message}>
            <ThemedText themeColor="textSecondary">Loading schedule...</ThemedText>
          </View>
        ) : isError ? (
          <Pressable
            onPress={() => void refetch()}
            style={styles.message}
            accessibilityRole="button"
          >
            <ThemedText style={{ color: colors.error }}>
              Could not load schedule. Tap to retry.
            </ThemedText>
          </Pressable>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(entry) => `${entry.channelId}-${entry.start.toISOString()}`}
            contentContainerStyle={styles.programList}
            ListEmptyComponent={
              <View style={styles.message}>
                <ThemedText themeColor="textSecondary">No programs in this time range.</ThemedText>
              </View>
            }
            renderItem={({ item }) => <GuideProgram entry={item} now={now} />}
          />
        )}
      </View>
    </SlideUpSheet>
  );
}

function GuideProgram({ entry, now }: { readonly entry: GuideEntry; readonly now: number }) {
  const { colors } = useTheme();
  const live = entry.start.getTime() <= now && entry.end.getTime() > now;
  const time = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={[styles.program, { borderBottomColor: colors.borderMuted }]}>
      <View style={styles.timeColumn}>
        <ThemedText variant="titleSmall">{time(entry.start)}</ThemedText>
        <ThemedText variant="caption" themeColor="textSecondary">
          {entry.start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </ThemedText>
      </View>
      <View
        style={[
          styles.programMarker,
          { backgroundColor: live ? colors.error : colors.primaryMuted },
        ]}
      />
      <View style={styles.programInfo}>
        <View style={styles.programTitleRow}>
          <ThemedText variant="titleSmall" numberOfLines={2} style={styles.programTitle}>
            {entry.title}
          </ThemedText>
          {live ? (
            <View style={[styles.liveBadge, { backgroundColor: colors.errorMuted }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
              <ThemedText variant="overline" style={{ color: colors.error }}>
                LIVE
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText variant="caption" themeColor="textSecondary">
          {time(entry.start)} - {time(entry.end)}
        </ThemedText>
        {entry.description ? (
          <ThemedText variant="caption" themeColor="textSecondary" numberOfLines={2}>
            {entry.description}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  channelHeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.xxs,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.xxs,
    borderRadius: Radius.md,
  },
  rangeOption: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programList: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  program: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeColumn: {
    width: 62,
    gap: Spacing.xxs,
  },
  programMarker: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: Radius.full,
  },
  programInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  programTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  programTitle: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  message: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});

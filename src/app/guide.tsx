import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChannels, useGuide } from '@/data/queries/iptv';
import { LoadingView, ChannelCard } from '@/components/ui';
import type { Channel, GuideEntry } from '@/types/domain';

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ProgramItem({ entry, isLive }: { entry: GuideEntry; isLive?: boolean }) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.programItem, { backgroundColor: colors.backgroundElevated }]}>
      <View style={styles.programTime}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.timeText}>
          {formatTime(entry.start)} - {formatTime(entry.end)}
        </ThemedText>
        {isLive && (
          <View style={styles.liveBadge}>
            <ThemedText style={styles.liveText}>LIVE</ThemedText>
          </View>
        )}
      </View>
      <ThemedText style={styles.programTitle} numberOfLines={1}>
        {entry.title}
      </ThemedText>
      {entry.description && (
        <ThemedText type="small" themeColor="textTertiary" numberOfLines={2}>
          {entry.description}
        </ThemedText>
      )}
    </View>
  );
}

function EpgRow({ channel }: { channel: Channel }) {
  const { data: guide, isLoading } = useGuide(channel.id);
  
  const [nowTime] = React.useState(() => Date.now());
  
  // Filter for current and future programs
  const upcoming = React.useMemo(() => {
    if (!guide) return [];
    return guide.filter(entry => entry.end.getTime() > nowTime).slice(0, 5); // Show next 5
  }, [guide, nowTime]);

  if (isLoading) {
    return (
      <View style={styles.row}>
        <View style={styles.channelCol}>
          <ChannelCard channel={channel} style={{ width: 140 }} />
        </View>
        <View style={styles.programsCol}>
          <ThemedText type="small" themeColor="textSecondary">Loading schedule...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.channelCol}>
        <ChannelCard channel={channel} style={{ width: 140 }} />
      </View>
      
      <FlatList
        data={upcoming}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.start.toISOString()}
        contentContainerStyle={styles.programsList}
        renderItem={({ item, index }) => {
          return <ProgramItem entry={item} isLive={index === 0 && item.start.getTime() <= nowTime && item.end.getTime() > nowTime} />;
        }}
        ListEmptyComponent={
          <View style={styles.emptyPrograms}>
            <ThemedText type="small" themeColor="textSecondary">No guide data available</ThemedText>
          </View>
        }
      />
    </View>
  );
}

export default function GuideScreen() {
  const { data: channels, isLoading } = useChannels();
  
  if (isLoading) {
    return <LoadingView message="Loading TV Guide..." />;
  }

  // To prevent the list from being overwhelmingly huge for initial render, we can just show the first 100 channels.
  // In a real app, we might filter by favorites, categories, or implement pagination.
  const displayChannels = (channels || []).slice(0, 100);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">TV Guide</ThemedText>
          <ThemedText themeColor="textSecondary">Live and upcoming programs</ThemedText>
        </View>
        
        <FlatList
          data={displayChannels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
          renderItem={({ item }) => <EpgRow channel={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.xl,
    gap: Spacing.one,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  channelCol: {
    paddingLeft: Spacing.four,
    justifyContent: 'center',
  },
  programsCol: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  programsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  programItem: {
    width: 240,
    padding: Spacing.md,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  programTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontWeight: '600',
  },
  programTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  liveBadge: {
    backgroundColor: '#E53935',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyPrograms: {
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginLeft: Spacing.four,
  }
});

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '../themed-text';
import { CardContent, PressableCard } from './card';

import type { Channel } from '@/types/domain';
import { useTheme } from '@/hooks/use-theme';

interface ChannelCardProps {
  readonly channel: Channel;
  readonly onPress?: (channel: Channel) => void;
}

export function ChannelCard({ channel, onPress }: ChannelCardProps) {
  const { colors } = useTheme();

  return (
    <PressableCard
      variant="elevated"
      onPress={onPress ? () => onPress(channel) : undefined}
      style={styles.card}
    >
      <CardContent style={styles.content}>
        {/* Placeholder for Logo, since we don't have images locally, we can just use initials or name */}
        <View style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundElement }]}>
          <ThemedText style={[styles.initials, { color: colors.textSecondary }]}>
            {channel.name.substring(0, 2).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText numberOfLines={1} style={styles.name}>
          {channel.name}
        </ThemedText>
        <ThemedText type="small" numberOfLines={1} style={[styles.category, { color: colors.textSecondary }]}>
          {channel.country ?? 'Unknown'}
        </ThemedText>
      </CardContent>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 12,
  },
  content: {
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
  category: {
    textAlign: 'center',
  },
});

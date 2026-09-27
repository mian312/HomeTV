import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';

interface ChannelAvatarStackProps {
  readonly channels: readonly Channel[];
  readonly totalCount?: number;
  readonly maxVisible?: number;
}

export function ChannelAvatarStack({
  channels,
  totalCount = channels.length,
  maxVisible = 3,
}: ChannelAvatarStackProps) {
  const { colors } = useTheme();
  const visibleChannels = channels.slice(0, maxVisible);
  const overflow = Math.max(0, totalCount - visibleChannels.length);

  return (
    <View style={styles.stack} accessibilityLabel={`${totalCount} channels`}>
      {visibleChannels.map((channel) => (
        <View
          key={channel.id}
          style={[
            styles.avatar,
            { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundElevated },
          ]}
        >
          {channel.logoUrl ? (
            <Image source={{ uri: channel.logoUrl }} style={styles.image} contentFit="contain" />
          ) : (
            <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
              {channel.name.slice(0, 1).toUpperCase()}
            </ThemedText>
          )}
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.avatar,
            styles.overflow,
            { backgroundColor: colors.primaryMuted, borderColor: colors.backgroundElevated },
          ]}
          accessibilityLabel={`${overflow} more channels`}
        >
          <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
            +{overflow}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.xs,
  },
  avatar: {
    width: 34,
    height: 34,
    marginLeft: -Spacing.xs,
    borderWidth: 2,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overflow: {
    marginLeft: -Spacing.xs,
  },
});

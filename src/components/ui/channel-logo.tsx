import { Image, type ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';

interface ChannelLogoProps {
  readonly channel: Channel;
  readonly style: StyleProp<ImageStyle>;
  readonly initialsLength?: 1 | 2;
}

export function ChannelLogo({ channel, style, initialsLength = 2 }: ChannelLogoProps) {
  const { colors } = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const logoUrl = channel.logoUrl;

  if (logoUrl && failedUrl !== logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={style}
        contentFit="contain"
        cachePolicy="disk"
        recyclingKey={channel.id}
        transition={150}
        accessibilityLabel={`${channel.name} logo`}
        onError={() => setFailedUrl(logoUrl)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        style as StyleProp<ViewStyle>,
        { backgroundColor: colors.backgroundElement },
      ]}
      accessibilityLabel={`${channel.name} logo unavailable`}
    >
      <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
        {channel.name.slice(0, initialsLength).toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

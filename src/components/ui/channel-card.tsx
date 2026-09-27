import { StyleProp, StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '../themed-text';
import { CardContent, PressableCard } from './card';

import type { Channel } from '@/types/domain';
import { useTheme } from '@/hooks/use-theme';
import { useIsFavorite, useToggleFavorite } from '@/data/queries/local';
import { SymbolView } from 'expo-symbols';

interface ChannelCardProps {
  readonly channel: Channel;
  readonly onPress?: (channel: Channel) => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function ChannelCard({ channel, onPress, style }: ChannelCardProps) {
  const { colors } = useTheme();
  
  const entityRef = { entityType: 'channel' as const, entityId: channel.id };
  const { data: isFavorite } = useIsFavorite(entityRef);
  const { mutate: toggleFavorite } = useToggleFavorite();

  const handleFavoritePress = () => {
    toggleFavorite({
      entityRef,
      isFavorite: !!isFavorite,
    });
  };

  return (
    <PressableCard
      variant="elevated"
      onPress={onPress ? () => onPress(channel) : undefined}
      style={[styles.card, style]}
    >
      <CardContent style={styles.content}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundElement }]}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText style={[styles.initials, { color: colors.textSecondary }]}>
              {channel.name.substring(0, 2).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={styles.textContainer}>
          <ThemedText numberOfLines={1} style={styles.name}>
            {channel.name}
          </ThemedText>
          <ThemedText type="small" numberOfLines={1} style={[styles.category, { color: colors.textSecondary }]}>
            {channel.country ?? 'Unknown'}
          </ThemedText>
        </View>
        <Pressable
          onPress={handleFavoritePress}
          style={({ pressed }) => [styles.favoriteButton, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <SymbolView
            name={isFavorite ? 'heart.fill' : 'heart'}
            size={18}
            tintColor={isFavorite ? colors.primary : colors.textTertiary}
            fallback={
              <ThemedText style={{ color: isFavorite ? colors.primary : colors.textTertiary }}>
                {isFavorite ? '♥' : '♡'}
              </ThemedText>
            }
          />
        </Pressable>
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
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { HorizontalList, ChannelCard, HeroCarousel } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Channel } from '@/types/domain';
import type { HomeSectionDescriptor, PersonalizationModel } from '../index';
import { sortChannelsByScore } from '../scoring';

interface HomeSectionRendererProps {
  descriptor: HomeSectionDescriptor;
  channels: readonly Channel[];
  model: PersonalizationModel;
}

export function HomeSectionRenderer({ descriptor, channels, model }: HomeSectionRendererProps) {
  const data = useMemo(() => {
    switch (descriptor.type) {
      case 'recently-watched':
        // model.recentChannels is already ordered by most recent first
        return model.recentChannels
          .map(id => channels.find(c => c.id === id))
          .filter((c): c is Channel => c !== undefined);

      case 'favorites':
        // Map Set to Array and resolve channels
        return Array.from(model.favorites)
          .map(id => channels.find(c => c.id === id))
          .filter((c): c is Channel => c !== undefined);

      case 'recommended': {
        const channelsToScore = channels.length > 500 ? channels.slice(0, 500) : channels;
        return sortChannelsByScore(channelsToScore, model).slice(0, 20);
      }

      case 'category':
        return channels.filter(c => c.categories.includes(descriptor.categoryId as any));

      case 'country':
        return channels.filter(c => c.country === descriptor.countryCode);

      case 'language':
        return channels.filter(c => c.languages.includes(descriptor.languageCode as any));

      default:
        return [];
    }
  }, [descriptor, channels, model]);

  let title = '';
  switch (descriptor.type) {
    case 'recently-watched': title = 'Continue Watching'; break;
    case 'favorites': title = 'Your Favorites'; break;
    case 'recommended': title = 'Recommended For You'; break;
    case 'category': title = `Category: ${capitalize(descriptor.categoryId)}`; break;
    case 'country': title = `From: ${descriptor.countryCode.toUpperCase()}`; break;
    case 'language': title = `Language: ${descriptor.languageCode.toUpperCase()}`; break;
  }

  // T066: Hide Continue Watching if empty
  if (descriptor.type === 'recently-watched' && data.length === 0) {
    return null;
  }

  if (descriptor.type === 'recently-watched') {
    return <HeroCarousel channels={data} />;
  }

  return (
    <HorizontalList
      title={title}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChannelCard channel={item} />}
      ListEmptyComponent={
        // T073: Explicit empty state for personalized sections
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No channels found for this section.
          </ThemedText>
        </View>
      }
    />
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  emptyText: {
    opacity: 0.6,
    fontSize: 14,
  }
});

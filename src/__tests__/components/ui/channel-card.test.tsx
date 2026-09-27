import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { ChannelCard } from '@/components/ui/channel-card';
import { HorizontalList } from '@/components/ui/horizontal-list';
import type { Channel } from '@/types/domain';

jest.mock('@/data/queries/local', () => ({
  useIsFavorite: jest.fn(() => ({ data: false })),
  useToggleFavorite: jest.fn(() => ({ mutate: jest.fn() })),
}));

const mockChannel: Channel = {
  id: 'test-1' as any,
  name: 'Test Channel',
  country: 'US' as any,
  altNames: [],
  network: null,
  subdivision: null,
  city: null,
  categories: [],
  languages: [],
  isNsfw: false,
  logoUrl: null,
  website: null,
  launched: null,
  closed: null,
};

describe('ChannelCard', () => {
  it('renders channel name and country', () => {
    render(<ChannelCard channel={mockChannel} />);
    expect(screen.getByText('Test Channel')).toBeTruthy();
    expect(screen.getByText('US')).toBeTruthy();
    expect(screen.getByText('TE')).toBeTruthy(); // initials
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<ChannelCard channel={mockChannel} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(mockChannel);
  });
});

describe('HorizontalList', () => {
  it('renders title and items', () => {
    render(
      <HorizontalList
        title="Featured"
        data={[mockChannel]}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ChannelCard channel={item} />}
      />
    );
    expect(screen.getByText('Featured')).toBeTruthy();
    expect(screen.getByText('Test Channel')).toBeTruthy();
  });

  it('renders See All button when onSeeAll is provided', () => {
    const onSeeAll = jest.fn();
    render(
      <HorizontalList
        title="Featured"
        data={[mockChannel]}
        onSeeAll={onSeeAll}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ChannelCard channel={item} />}
      />
    );
    fireEvent.press(screen.getByRole('button', { name: 'See all Featured' }));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});

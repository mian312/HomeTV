import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HeroCarousel } from '@/components/ui/hero-carousel';
import type { Channel } from '@/types/domain';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
  };
});

describe('HeroCarousel', () => {
  const createChannel = (id: string, name: string): Channel => ({
    id, name, country: 'us', languages: ['eng'], categories: ['news'], isAdult: false, streamUrl: 'http://test'
  });

  it('renders nothing when channels array is empty', () => {
    const { toJSON } = render(<HeroCarousel channels={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders the carousel items', () => {
    const channels = [
      createChannel('c1', 'First Channel'),
      createChannel('c2', 'Second Channel')
    ];
    
    render(<HeroCarousel channels={channels} />);
    
    expect(screen.getByText('First Channel')).toBeTruthy();
    expect(screen.getByText('Second Channel')).toBeTruthy();
    // Verify badge text
    expect(screen.getAllByText('CONTINUE WATCHING')).toHaveLength(2);
  });
});

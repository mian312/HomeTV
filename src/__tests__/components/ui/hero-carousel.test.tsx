import { HeroCarousel } from '@/components/ui/hero-carousel';
import type { CategoryId, Channel, ChannelId, CountryCode, LanguageCode } from '@/types/domain';
import { render, screen } from '@testing-library/react-native';

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
    id: id as ChannelId, name, country: 'us' as CountryCode, languages: ['eng'] as unknown as LanguageCode[], categories: ['news'] as unknown as CategoryId[]
  } as unknown as Channel);

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

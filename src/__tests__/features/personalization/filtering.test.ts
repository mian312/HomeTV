import { filterChannels } from '@/features/personalization/filtering';
import type { Channel } from '@/types/domain';

describe('Channel filtering helpers', () => {
  const createChannel = (id: string, name: string, country: string | null, languages: string[], categories: string[]): Channel => ({
    id, name, country, languages, categories, isAdult: false, streamUrl: 'http://test'
  });

  const channels = [
    createChannel('1', 'BBC News', 'uk', ['eng'], ['news']),
    createChannel('2', 'Sky Sports', 'uk', ['eng'], ['sports']),
    createChannel('3', 'CNN News', 'us', ['eng'], ['news']),
    createChannel('4', 'TF1', 'fr', ['fre'], ['entertainment'])
  ];

  it('filters by search query', () => {
    const result = filterChannels(channels, { searchQuery: 'news' });
    expect(result.map(c => c.id)).toEqual(['1', '3']);
  });

  it('filters by country', () => {
    const result = filterChannels(channels, { countries: ['uk'] });
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });

  it('filters by multiple criteria (AND logic for different properties)', () => {
    const result = filterChannels(channels, { countries: ['uk'], categories: ['sports'] });
    expect(result.map(c => c.id)).toEqual(['2']);
  });

  it('filters by language (OR logic within the property)', () => {
    const result = filterChannels(channels, { languages: ['fre'] });
    expect(result.map(c => c.id)).toEqual(['4']);
  });

  it('returns all channels when filters are empty', () => {
    const result = filterChannels(channels, {});
    expect(result.length).toBe(4);
  });
});

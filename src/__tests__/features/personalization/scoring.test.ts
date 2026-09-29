import { scoreChannel, sortChannelsByScore } from '@/features/personalization/scoring';
import type { Channel } from '@/types/domain';
import type { PersonalizationModel } from '@/features/personalization/model';

describe('Local recommendation scoring', () => {
  const model: PersonalizationModel = {
    preferredCountries: new Set(['us']),
    preferredLanguages: new Set(['eng']),
    preferredCategories: new Set(['news']),
    preferredHomeSections: ['favorites', 'recently-watched', 'categories'],
    favorites: new Set(['chan1']),
    recentChannels: ['chan2']
  };

  const createChannel = (id: string, name: string, country: string | null, languages: string[], categories: string[]): Channel => ({
    id, name, country, languages, categories, isAdult: false, streamUrl: 'http://test'
  });

  const c1 = createChannel('chan1', 'A', 'uk', ['eng'], []); // Fav (100) + Lang (20) = 120
  const c2 = createChannel('chan2', 'B', 'us', [], []); // Recent (50) + Country (20) = 70
  const c3 = createChannel('chan3', 'C', 'us', ['eng'], ['news']); // Country (20) + Lang (20) + Cat (20) = 60
  const c4 = createChannel('chan4', 'D', 'fr', ['fre'], ['sports']); // None = 0

  it('calculates deterministic scores', () => {
    const s1 = scoreChannel(c1, model);
    expect(s1.score).toBe(120);
    expect(s1.reasons).toContain('favorite');
    expect(s1.reasons).toContain('preferred_language');

    const s3 = scoreChannel(c3, model);
    expect(s3.score).toBe(60);
    expect(s3.reasons).toEqual(['preferred_country', 'preferred_language', 'preferred_category']);
  });

  it('sorts channels by score descending', () => {
    const sorted = sortChannelsByScore([c4, c3, c2, c1], model);
    expect(sorted.map(c => c.id)).toEqual(['chan1', 'chan2', 'chan3', 'chan4']);
  });

  it('sorts alphabetically for ties', () => {
    const c5 = createChannel('chan5', 'Z', null, [], []);
    const c6 = createChannel('chan6', 'A', null, [], []);
    const sorted = sortChannelsByScore([c5, c6], model);
    expect(sorted.map(c => c.id)).toEqual(['chan6', 'chan5']);
  });
});

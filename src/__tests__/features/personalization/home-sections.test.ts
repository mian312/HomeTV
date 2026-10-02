import { resolveHomeSections } from '@/features/personalization/home-sections';
import type { PersonalizationModel } from '@/features/personalization/model';
import type { ChannelId } from '@/types/domain';

describe('resolveHomeSections', () => {
  it('generates standard sections and preferred categories', () => {
    const model: PersonalizationModel = {
      preferredCountries: new Set(['us']),
      preferredLanguages: new Set(['eng']),
      preferredCategories: new Set(['news', 'sports']),
      preferredHomeSections: ['favorites', 'recently-watched', 'categories'],
      favorites: new Set(['c1' as ChannelId]),
      recentChannels: ['c2' as ChannelId],
    };

    const sections = resolveHomeSections(model);

    expect(sections).toEqual([
      { type: 'recently-watched' },
      { type: 'favorites' },
      { type: 'recommended' },
      { type: 'category', categoryId: 'news' },
      { type: 'category', categoryId: 'sports' },
    ]);
  });

  it('generates only standard sections if no preferred categories exist', () => {
    const model: PersonalizationModel = {
      preferredCountries: new Set(),
      preferredLanguages: new Set(),
      preferredCategories: new Set(),
      preferredHomeSections: [],
      favorites: new Set(),
      recentChannels: [],
    };

    const sections = resolveHomeSections(model);

    expect(sections).toEqual([
      { type: 'recently-watched' },
      { type: 'favorites' },
      { type: 'recommended' },
    ]);
  });
});

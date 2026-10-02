import { buildPersonalizationModel } from '@/features/personalization/model';
import { preferenceRepository, favoritesRepository, recentlyWatchedRepository } from '@/data/repositories';
import type { ProfileId } from '@/types/domain';

jest.mock('@/data/repositories', () => ({
  preferenceRepository: {
    get: jest.fn(),
  },
  favoritesRepository: {
    getAll: jest.fn(),
  },
  recentlyWatchedRepository: {
    getAll: jest.fn(),
  },
}));

describe('buildPersonalizationModel', () => {
  const profileId = 'test-profile-id' as ProfileId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds model from empty repositories using defaults', async () => {
    jest.mocked(preferenceRepository.get).mockResolvedValue(null);
    jest.mocked(favoritesRepository.getAll).mockResolvedValue([]);
    jest.mocked(recentlyWatchedRepository.getAll).mockResolvedValue([]);

    const model = await buildPersonalizationModel(profileId);

    expect(model.preferredCountries.size).toBe(0);
    expect(model.preferredLanguages.size).toBe(0);
    expect(model.preferredCategories.size).toBe(0);
    expect(model.preferredHomeSections).toEqual(['favorites', 'recently-watched', 'categories']);
    expect(model.favorites.size).toBe(0);
    expect(model.recentChannels.length).toBe(0);
  });

  it('builds model correctly from populated repositories', async () => {
    jest.mocked(preferenceRepository.get).mockImplementation(async (_profileId: ProfileId, key: string) => {
      if (key === 'countries') return ['us', 'uk'];
      if (key === 'languages') return ['eng'];
      if (key === 'categories') return ['news'];
      if (key === 'home_sections') return ['categories', 'favorites'];
      return null;
    });

    jest.mocked(favoritesRepository.getAll).mockResolvedValue([
      { entityRef: { entityType: 'channel', entityId: 'c1' }, createdAt: new Date() },
      { entityRef: { entityType: 'playlist' as any, entityId: 'p1' }, createdAt: new Date() }, // Should be ignored
    ]);

    jest.mocked(recentlyWatchedRepository.getAll).mockResolvedValue([
      { entityRef: { entityType: 'channel', entityId: 'c2' }, watchedAt: new Date() },
    ]);

    const model = await buildPersonalizationModel(profileId);

    expect(Array.from(model.preferredCountries)).toEqual(['us', 'uk']);
    expect(Array.from(model.preferredLanguages)).toEqual(['eng']);
    expect(Array.from(model.preferredCategories)).toEqual(['news']);
    expect(model.preferredHomeSections).toEqual(['categories', 'favorites']);
    
    // Check that only channels are mapped to favorites and recents
    expect(Array.from(model.favorites)).toEqual(['c1']);
    expect(model.recentChannels).toEqual(['c2']);
  });
});

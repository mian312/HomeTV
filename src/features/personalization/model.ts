import { preferenceRepository, favoritesRepository, recentlyWatchedRepository } from '@/data/repositories';
import type { ProfileId, ChannelId } from '@/types/domain';

export interface PersonalizationModel {
  preferredCountries: Set<string>;
  preferredLanguages: Set<string>;
  preferredCategories: Set<string>;
  preferredHomeSections: string[];
  favorites: Set<ChannelId>;
  recentChannels: ChannelId[];
}

/**
 * Builds a comprehensive personalization model for the given profile by loading
 * its preferences, favorites, and history from local storage.
 */
export async function buildPersonalizationModel(profileId: ProfileId): Promise<PersonalizationModel> {
  const [
    countries,
    languages,
    categories,
    homeSections,
    favs,
    recents
  ] = await Promise.all([
    preferenceRepository.get<string[]>(profileId, 'countries'),
    preferenceRepository.get<string[]>(profileId, 'languages'),
    preferenceRepository.get<string[]>(profileId, 'categories'),
    preferenceRepository.get<string[]>(profileId, 'home_sections'),
    favoritesRepository.getAll(),
    recentlyWatchedRepository.getAll()
  ]);

  return {
    preferredCountries: new Set(countries ?? []),
    preferredLanguages: new Set(languages ?? []),
    preferredCategories: new Set(categories ?? []),
    preferredHomeSections: homeSections ?? ['recently-watched', 'favorites', 'categories'],
    favorites: new Set(favs.filter(f => f.entityRef.entityType === 'channel').map(f => f.entityRef.entityId as ChannelId)),
    recentChannels: recents.filter(r => r.entityRef.entityType === 'channel').map(r => r.entityRef.entityId as ChannelId)
  };
}

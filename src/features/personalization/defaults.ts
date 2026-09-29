import type { PersonalizationModel } from './model';
import type { FilterState } from './filtering';

/**
 * Derives the default browse filter state from a user's personalization model.
 * If the user has preferences, they become the default filters, so they only see
 * relevant content by default but can clear the filters to see everything.
 */
export function getDefaultFilterState(model: PersonalizationModel): FilterState {
  const state: FilterState = {};

  if (model.preferredCountries.size > 0) {
    state.countries = Array.from(model.preferredCountries);
  }

  if (model.preferredLanguages.size > 0) {
    state.languages = Array.from(model.preferredLanguages);
  }

  if (model.preferredCategories.size > 0) {
    state.categories = Array.from(model.preferredCategories);
  }

  return state;
}

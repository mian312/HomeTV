import type { Channel } from '@/types/domain';

export interface FilterState {
  countries?: string[];
  languages?: string[];
  categories?: string[];
  searchQuery?: string;
}

/**
 * Applies a set of active filters to a list of channels.
 */
export function filterChannels(channels: Channel[], filters: FilterState): Channel[] {
  return channels.filter(channel => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (!channel.name.toLowerCase().includes(q)) {
        return false;
      }
    }

    if (filters.countries && filters.countries.length > 0) {
      if (!channel.country || !filters.countries.includes(channel.country)) {
        return false;
      }
    }

    if (filters.languages && filters.languages.length > 0) {
      const hasMatch = channel.languages.some(lang => filters.languages!.includes(lang));
      if (!hasMatch) return false;
    }

    if (filters.categories && filters.categories.length > 0) {
      const hasMatch = channel.categories.some(cat => filters.categories!.includes(cat));
      if (!hasMatch) return false;
    }

    return true;
  });
}

import type { Types } from '@iptv-org/sdk';

import type {
  Category,
  CategoryId,
  Channel,
  ChannelId,
  Country,
  CountryCode,
  GuideEntry,
  Language,
  LanguageCode,
  Stream,
} from '@/types/domain';
import { IptvProvider, ProviderError } from '../provider';

const API_BASE = 'https://iptv-org.github.io/api';

/**
 * iptv-org provider implementation.
 *
 * Uses raw fetch instead of the SDK's Client class because the SDK's
 * DataManager relies on Node's `fs-extra` and `axios`, which can cause
 * bundling/runtime issues in React Native.
 *
 * We still use the SDK's Types to ensure compile-time safety when
 * interpreting the JSON payloads.
 */
export class IptvOrgProvider implements IptvProvider {
  readonly name = 'iptv-org';

  private async fetchApi<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) {
        throw new ProviderError(
          `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`,
          'NETWORK',
        );
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(`Network error fetching ${endpoint}`, 'NETWORK', error);
    }
  }

  async getChannels(): Promise<readonly Channel[]> {
    const raw = await this.fetchApi<Types.ChannelData[]>('/channels.json');
    return raw.map(mapChannel);
  }

  async getStreams(channelId: ChannelId): Promise<readonly Stream[]> {
    const raw = await this.fetchApi<Types.StreamData[]>('/streams.json');
    // The API provides all streams in one file, so we filter.
    // In a real scenario with large data, we might want to let TanStack Query cache the
    // full list and filter in the selector, or use get_all_streams.
    // For now, we fetch all and filter.
    return raw.filter((s) => s.channel === channelId).map((s) => mapStream(s, channelId));
  }

  async getAllStreams(): Promise<readonly Stream[]> {
    const raw = await this.fetchApi<Types.StreamData[]>('/streams.json');
    return raw.filter((s) => s.channel != null).map((s) => mapStream(s, s.channel as ChannelId));
  }

  async getCategories(): Promise<readonly Category[]> {
    const raw = await this.fetchApi<Types.CategoryData[]>('/categories.json');
    return raw.map(mapCategory);
  }

  async getCountries(): Promise<readonly Country[]> {
    const raw = await this.fetchApi<Types.CountryData[]>('/countries.json');
    return raw.map(mapCountry);
  }

  async getLanguages(): Promise<readonly Language[]> {
    const raw = await this.fetchApi<Types.LanguageData[]>('/languages.json');
    return raw.map(mapLanguage);
  }

  async getGuide(channelId: ChannelId): Promise<readonly GuideEntry[]> {
    // iptv-org has guides in a separate repo/structure.
    // We return empty for now since we don't have a direct JSON endpoint for all guides yet,
    // or we'll need to parse XMLTV later.
    return [];
  }
}

// ---------------------------------------------------------------------------
// Mappers (T009: Establish domain data mapping)
// ---------------------------------------------------------------------------

function mapChannel(raw: Types.ChannelData): Channel {
  return {
    id: raw.id as ChannelId,
    name: raw.name,
    altNames: raw.alt_names || [],
    network: raw.network || null,
    country: (raw.country as CountryCode) || null,
    subdivision: null, // Removed in v1.5 API or not present in ChannelData
    city: null, // Same
    categories: (raw.categories as CategoryId[]) || [],
    languages: [], // Need cross-reference or we ignore for now, wait, ChannelData might not have it directly
    isNsfw: raw.is_nsfw ?? false,
    logoUrl: null, // Logo is separate in iptv-org API, wait, we might need it?
    // We will leave logoUrl null here and join it in the UI/Query layer if needed, or
    // update this if we find a way to get it directly. Actually, the UI can fall back to name.
    website: raw.website || null,
    launched: raw.launched || null,
    closed: raw.closed || null,
  };
}

function mapStream(raw: Types.StreamData, channelId: ChannelId): Stream {
  return {
    channelId,
    url: raw.url,
    httpReferrer: raw.referrer || null,
    userAgent: raw.user_agent || null,
  };
}

function mapCategory(raw: Types.CategoryData): Category {
  return {
    id: raw.id as CategoryId,
    name: raw.name,
  };
}

function mapCountry(raw: Types.CountryData): Country {
  return {
    code: raw.code as CountryCode,
    name: raw.name,
    flag: raw.flag || '',
    languages: (raw.languages as LanguageCode[]) || [],
  };
}

function mapLanguage(raw: Types.LanguageData): Language {
  return {
    code: raw.code as LanguageCode,
    name: raw.name,
  };
}

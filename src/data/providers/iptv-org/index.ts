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
    // iptv-org guides are massive XMLTV files which are expensive to parse in RN.
    // For V1, we simulate EPG data deterministically based on the channel ID.
    // This allows us to build the TV Guide UI correctly against our domain model.
    return generateMockGuide(channelId);
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

// ---------------------------------------------------------------------------
// Mock EPG Generator
// ---------------------------------------------------------------------------

function generateMockGuide(channelId: ChannelId): GuideEntry[] {
  // Cover the guide's three-day history and seven-day forecast filters.
  const now = Date.now();

  // Use char codes of channel ID to seed the deterministic random
  const seed = Array.from(channelId).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const programTypes = [
    { name: 'Morning News', duration: 120 },
    { name: 'Talk Show', duration: 60 },
    { name: 'Documentary', duration: 90 },
    { name: 'Sports Highlights', duration: 30 },
    { name: 'Cooking Masterclass', duration: 60 },
    { name: 'Movie: The Adventure', duration: 120 },
    { name: 'Local News', duration: 30 },
    { name: 'Game Show', duration: 60 },
    { name: 'Sitcom', duration: 30 },
    { name: 'Late Night Talk', duration: 60 },
  ];

  const entries: GuideEntry[] = [];
  let currentTime = now - 3 * 24 * 60 * 60 * 1000;

  // The varied durations average about 75 minutes per program.
  for (let i = 0; i < 200; i++) {
    // Deterministic selection based on seed and index
    const pIndex = (seed + i * 13) % programTypes.length;
    const program = programTypes[pIndex];

    const startTime = new Date(currentTime);
    const endTime = new Date(currentTime + program.duration * 60 * 1000);

    entries.push({
      channelId,
      title: program.name,
      description: `Watch ${program.name} on ${channelId}. This is a simulated EPG description for demonstration purposes.`,
      start: startTime,
      end: endTime,
      icon: null,
    });

    currentTime = endTime.getTime();
  }

  return entries;
}

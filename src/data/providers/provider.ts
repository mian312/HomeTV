/**
 * IPTV provider contract.
 *
 * The UI and feature layers never import a concrete provider. They depend on
 * this interface and receive data as HomeTV domain types.
 *
 * The initial implementation is `IptvOrgProvider` in `src/data/providers/iptv-org/`.
 * Future providers (M3U, Xtream, backend) implement the same contract.
 */

import type {
  Category,
  Channel,
  ChannelId,
  Country,
  GuideEntry,
  Language,
  Stream,
} from '@/types/domain';

// ---------------------------------------------------------------------------
// Provider result – provider methods return data or throw typed errors
// ---------------------------------------------------------------------------

/** Error thrown by a provider when a request cannot be fulfilled. */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: ProviderErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export type ProviderErrorCode =
  | 'NETWORK'
  | 'NOT_FOUND'
  | 'PARSE'
  | 'UNKNOWN';

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface IptvProvider {
  /** Human-readable name for UI / debugging. */
  readonly name: string;

  /** Fetch the full channel catalog. */
  getChannels(): Promise<readonly Channel[]>;

  /** Fetch available streams for a given channel. */
  getStreams(channelId: ChannelId): Promise<readonly Stream[]>;

  /** Fetch all streams (bulk). */
  getAllStreams(): Promise<readonly Stream[]>;

  /** Fetch the list of categories/genres. */
  getCategories(): Promise<readonly Category[]>;

  /** Fetch the list of countries. */
  getCountries(): Promise<readonly Country[]>;

  /** Fetch the list of broadcast languages. */
  getLanguages(): Promise<readonly Language[]>;

  /** Fetch guide/EPG entries for a channel, if available. */
  getGuide(channelId: ChannelId): Promise<readonly GuideEntry[]>;
}

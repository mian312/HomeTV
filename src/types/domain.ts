/**
 * HomeTV domain types.
 *
 * UI and feature layers depend on these types, never on raw provider SDK
 * models or SQLite row types. Provider adapters and repositories map their
 * data to these types at the integration boundary.
 */

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/** Opaque branded type for compile-time safety of entity IDs. */
type Brand<T, B extends string> = T & { readonly __brand: B };

/** Unique identifier for a channel within HomeTV. */
export type ChannelId = Brand<string, 'ChannelId'>;

/** Unique identifier for a category. */
export type CategoryId = Brand<string, 'CategoryId'>;

/** Unique identifier for a country (ISO 3166-1 alpha-2 code). */
export type CountryCode = Brand<string, 'CountryCode'>;

/** Unique identifier for a language (ISO 639-1 code). */
export type LanguageCode = Brand<string, 'LanguageCode'>;

// ---------------------------------------------------------------------------
// Core domain models
// ---------------------------------------------------------------------------

/** A TV channel as understood by the HomeTV application. */
export interface Channel {
  readonly id: ChannelId;
  readonly name: string;
  readonly altNames: readonly string[];
  readonly network: string | null;
  readonly country: CountryCode | null;
  readonly subdivision: string | null;
  readonly city: string | null;
  readonly categories: readonly CategoryId[];
  readonly languages: readonly LanguageCode[];
  readonly isNsfw: boolean;
  readonly logoUrl: string | null;
  readonly website: string | null;
  readonly launched: string | null;
  readonly closed: string | null;
}

/** A playable stream URL for a channel. */
export interface Stream {
  readonly channelId: ChannelId;
  readonly url: string;
  /** HTTP referrer required by some streams; null when not needed. */
  readonly httpReferrer: string | null;
  /** User-Agent header required by some streams; null when not needed. */
  readonly userAgent: string | null;
}

/** A browsable channel category/genre. */
export interface Category {
  readonly id: CategoryId;
  readonly name: string;
}

/** A country from which channels originate. */
export interface Country {
  readonly code: CountryCode;
  readonly name: string;
  readonly flag: string;
  readonly languages: readonly LanguageCode[];
}

/** A language in which channels broadcast. */
export interface Language {
  readonly code: LanguageCode;
  readonly name: string;
}

// ---------------------------------------------------------------------------
// EPG (TV Guide) – placeholder shape for future implementation
// ---------------------------------------------------------------------------

/** A single program/guide entry. */
export interface GuideEntry {
  readonly channelId: ChannelId;
  readonly title: string;
  readonly description: string | null;
  readonly start: Date;
  readonly end: Date;
  readonly icon: string | null;
}

// ---------------------------------------------------------------------------
// Local-only entities
// ---------------------------------------------------------------------------

/** Discriminated entity reference for favorites/playlists – supports future entity types. */
export type EntityType = 'channel';

export interface EntityRef {
  readonly entityType: EntityType;
  readonly entityId: string;
}

/** A user-created playlist. */
export interface Playlist {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** An item within a playlist. */
export interface PlaylistItem {
  readonly playlistId: string;
  readonly entityRef: EntityRef;
  readonly position: number;
  readonly addedAt: Date;
}

/** A recently-watched history entry (capped at 20). */
export interface RecentlyWatchedEntry {
  readonly entityRef: EntityRef;
  readonly watchedAt: Date;
}

/** A favorite entity. */
export interface Favorite {
  readonly entityRef: EntityRef;
  readonly createdAt: Date;
}

// ---------------------------------------------------------------------------
// Async data state – used by feature hooks to model loading/success/empty/error
// ---------------------------------------------------------------------------

export type AsyncState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly error: string };

/**
 * Repository contracts for local persistent data.
 *
 * Repositories own all SQLite access. Screens and feature hooks never
 * issue SQL directly — they call repository methods that accept and
 * return HomeTV domain types.
 *
 * Implementations are created in `src/data/repositories/` once the
 * SQLite foundation (T006) is in place.
 */

import type {
  EntityRef,
  Favorite,
  Playlist,
  PlaylistItem,
  RecentlyWatchedEntry,
} from '@/types/domain';

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export interface FavoritesRepository {
  /** Add an entity to favorites. No-op if already present. */
  add(ref: EntityRef): Promise<void>;

  /** Remove an entity from favorites. No-op if not present. */
  remove(ref: EntityRef): Promise<void>;

  /** Check whether an entity is a favorite. */
  isFavorite(ref: EntityRef): Promise<boolean>;

  /** Return all favorites, most recent first. */
  getAll(): Promise<readonly Favorite[]>;
}

// ---------------------------------------------------------------------------
// Recently watched
// ---------------------------------------------------------------------------

export interface RecentlyWatchedRepository {
  /**
   * Record that the user watched an entity.
   * If the entity already exists, its timestamp is updated and it moves to
   * the top. The list is capped at 20 entries — the oldest is trimmed.
   */
  record(ref: EntityRef): Promise<void>;

  /** Return the recently-watched list, most recent first. */
  getAll(): Promise<readonly RecentlyWatchedEntry[]>;

  /** Clear the entire history. */
  clear(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export interface PlaylistRepository {
  /** Create a new playlist and return it. */
  create(name: string): Promise<Playlist>;

  /** Rename an existing playlist. */
  rename(playlistId: string, name: string): Promise<void>;

  /** Delete a playlist and all its items. */
  delete(playlistId: string): Promise<void>;

  /** Return all playlists, ordered by most recently updated. */
  getAll(): Promise<readonly Playlist[]>;

  /** Return a single playlist by ID, or null if not found. */
  getById(playlistId: string): Promise<Playlist | null>;

  /** Add an entity to a playlist. */
  addItem(playlistId: string, ref: EntityRef): Promise<void>;

  /** Remove an entity from a playlist. */
  removeItem(playlistId: string, ref: EntityRef): Promise<void>;

  /** Return all items in a playlist, in order. */
  getItems(playlistId: string): Promise<readonly PlaylistItem[]>;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SettingsRepository {
  /** Get a setting value by key, or the default if absent. */
  get<T>(key: string, defaultValue: T): Promise<T>;

  /** Set a setting value. */
  set<T>(key: string, value: T): Promise<void>;

  /** Remove a setting. */
  remove(key: string): Promise<void>;
}

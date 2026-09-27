/**
 * Global database instance and repository singletons.
 *
 * Using expo-sqlite's openDatabaseSync allows us to use the database
 * outside of React context (e.g., Zustand stores, background tasks) while
 * still sharing the same underlying connection.
 */

import * as SQLite from 'expo-sqlite';

import { SqliteFavoritesRepository } from '../repositories/sqlite-favorites';
import { SqlitePlaylistRepository } from '../repositories/sqlite-playlists';
import { SqliteRecentlyWatchedRepository } from '../repositories/sqlite-recently-watched';
import { SqliteSettingsRepository } from '../repositories/sqlite-settings';

// Share a single global connection
export const db = SQLite.openDatabaseSync('hometv.db');

export const settingsRepository = new SqliteSettingsRepository(db);
export const favoritesRepository = new SqliteFavoritesRepository(db);
export const recentlyWatchedRepository = new SqliteRecentlyWatchedRepository(db);
export const playlistRepository = new SqlitePlaylistRepository(db);

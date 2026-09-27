/**
 * SQLite database schema and migrations.
 *
 * Uses the modern expo-sqlite API. We define migrations here to ensure
 * the database is properly initialized before the UI mounts.
 */

import { type SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;

  // Check current version
  let { user_version: currentVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  )) ?? { user_version: 0 };

  if (currentVersion >= DATABASE_VERSION) {
    return; // Already up to date
  }

  if (currentVersion === 0) {
    // Initial schema setup
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      PRAGMA foreign_keys = ON;

      -- Settings: Key-value store
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      -- Favorites
      CREATE TABLE IF NOT EXISTS favorites (
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (entity_type, entity_id)
      );

      -- Recently Watched
      CREATE TABLE IF NOT EXISTS recently_watched (
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        watched_at INTEGER NOT NULL,
        PRIMARY KEY (entity_type, entity_id)
      );
      CREATE INDEX IF NOT EXISTS idx_recently_watched_at ON recently_watched(watched_at DESC);

      -- Playlists
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Playlist Items
      CREATE TABLE IF NOT EXISTS playlist_items (
        playlist_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (playlist_id, entity_type, entity_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
      );
    `);

    currentVersion = 1;
  }

  // Future migrations go here...

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

/**
 * SQLite database schema and migrations.
 *
 * Uses a stepwise `user_version` chain rather than a single version gate so
 * that each migration runs exactly once and is independently verifiable.
 *
 * Version history:
 *   0 → 1  Initial V1 schema (settings, favorites, recently_watched, playlists, playlist_items).
 *   1 → 2  V2 profile support:
 *            - Add `profiles` table.
 *            - Rebuild `favorites` with (profile_id, entity_type, entity_id) PK.
 *            - Rebuild `recently_watched` with (profile_id, entity_type, entity_id) PK.
 *            - Add `profile_id` column (nullable) to `playlists`.
 *            - Backfill a "Main" profile when V1 rows exist; leave no profile when
 *              the V1 tables are empty (new installs go through profile creation).
 *
 * IMPORTANT: `PRAGMA foreign_keys` must be toggled OUTSIDE a transaction
 * (it is a no-op inside one). See the V2 migration step below.
 */

import { type SQLiteDatabase } from 'expo-sqlite';

const TARGET_VERSION = 3;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // Enable WAL and foreign keys at every open, not just on creation.
  // These are connection-level settings in SQLite.
  await db.execAsync(`PRAGMA journal_mode = 'wal'`);
  // foreign_keys must be set outside a transaction — it is a no-op inside one.
  await db.execAsync(`PRAGMA foreign_keys = ON`);

  let { user_version: currentVersion } =
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')) ??
    { user_version: 0 };

  if (currentVersion >= TARGET_VERSION) {
    return;
  }

  // ── Version 0 → 1: initial V1 schema ──────────────────────────────────────
  if (currentVersion === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        -- Settings: key-value store (application-global, not profile-scoped).
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        -- Favorites (V1: no profile scope).
        CREATE TABLE IF NOT EXISTS favorites (
          entity_type TEXT NOT NULL,
          entity_id   TEXT NOT NULL,
          created_at  INTEGER NOT NULL,
          PRIMARY KEY (entity_type, entity_id)
        );

        -- Recently Watched (V1: no profile scope).
        CREATE TABLE IF NOT EXISTS recently_watched (
          entity_type TEXT NOT NULL,
          entity_id   TEXT NOT NULL,
          watched_at  INTEGER NOT NULL,
          PRIMARY KEY (entity_type, entity_id)
        );
        CREATE INDEX IF NOT EXISTS idx_recently_watched_at
          ON recently_watched (watched_at DESC);

        -- Playlists (V1: no profile scope).
        CREATE TABLE IF NOT EXISTS playlists (
          id         TEXT PRIMARY KEY NOT NULL,
          name       TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        -- Playlist Items.
        CREATE TABLE IF NOT EXISTS playlist_items (
          playlist_id TEXT    NOT NULL,
          entity_type TEXT    NOT NULL,
          entity_id   TEXT    NOT NULL,
          position    INTEGER NOT NULL,
          added_at    INTEGER NOT NULL,
          PRIMARY KEY (playlist_id, entity_type, entity_id),
          FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
        );
      `);
    });

    await db.execAsync(`PRAGMA user_version = 1`);
    currentVersion = 1;
  }

  // ── Version 1 → 2: V2 profile support ─────────────────────────────────────
  if (currentVersion === 1) {
    // Step A: create the profiles table (outside the rebuild transaction so we
    // can reference it in the foreign keys of the new scoped tables).
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS profiles (
          id                   TEXT PRIMARY KEY NOT NULL,
          name                 TEXT NOT NULL,
          avatar_key           TEXT,
          pin_enabled          INTEGER NOT NULL DEFAULT 0,
          onboarding_completed INTEGER NOT NULL DEFAULT 0,
          created_at           TEXT NOT NULL,
          updated_at           TEXT NOT NULL
        );
      `);
    });

    // Step B: detect whether any V1 user data exists to decide whether to
    // create a "Main" backfill profile.
    const favCount = (await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM favorites',
    ))?.n ?? 0;
    const watchCount = (await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM recently_watched',
    ))?.n ?? 0;
    const playlistCount = (await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM playlists',
    ))?.n ?? 0;

    const hasV1Data = favCount > 0 || watchCount > 0 || playlistCount > 0;

    // Generate a stable profile ID (will be null for clean installs).
    let mainProfileId: string | null = null;
    if (hasV1Data) {
      // Use a fixed deterministic UUID for the legacy "Main" profile so that
      // a migration that runs twice (idempotency) does not create a duplicate.
      mainProfileId = '00000000-main-0000-0000-000000000000';
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR IGNORE INTO profiles
           (id, name, avatar_key, pin_enabled, onboarding_completed, created_at, updated_at)
         VALUES (?, 'Main', NULL, 0, 1, ?, ?)`,
        [mainProfileId, now, now],
      );
    }

    // Step C: rebuild favorites with profile_id in the primary key.
    // foreign_keys must be OFF while dropping/recreating tables that other
    // tables reference — but favorites is not referenced by anything, so we
    // can simply rebuild it safely inside a transaction.
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE favorites_v2 (
          profile_id  TEXT    NOT NULL,
          entity_type TEXT    NOT NULL,
          entity_id   TEXT    NOT NULL,
          created_at  INTEGER NOT NULL,
          PRIMARY KEY (profile_id, entity_type, entity_id),
          FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
        );
      `);

      if (hasV1Data && mainProfileId) {
        // Backfill V1 favorites into the Main profile.
        await db.runAsync(
          `INSERT INTO favorites_v2 (profile_id, entity_type, entity_id, created_at)
           SELECT ?, entity_type, entity_id, created_at FROM favorites`,
          [mainProfileId],
        );
      }

      await db.execAsync(`DROP TABLE favorites`);
      await db.execAsync(`ALTER TABLE favorites_v2 RENAME TO favorites`);
    });

    // Step D: rebuild recently_watched with profile_id in the primary key.
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE recently_watched_v2 (
          profile_id  TEXT    NOT NULL,
          entity_type TEXT    NOT NULL,
          entity_id   TEXT    NOT NULL,
          watched_at  INTEGER NOT NULL,
          PRIMARY KEY (profile_id, entity_type, entity_id),
          FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_rw_v2_watched_at
          ON recently_watched_v2 (profile_id, watched_at DESC);
      `);

      if (hasV1Data && mainProfileId) {
        await db.runAsync(
          `INSERT INTO recently_watched_v2 (profile_id, entity_type, entity_id, watched_at)
           SELECT ?, entity_type, entity_id, watched_at FROM recently_watched`,
          [mainProfileId],
        );
      }

      await db.execAsync(`DROP TABLE recently_watched`);
      await db.execAsync(`DROP INDEX IF EXISTS idx_recently_watched_at`);
      await db.execAsync(`ALTER TABLE recently_watched_v2 RENAME TO recently_watched`);
    });

    // Step E: add profile_id to playlists.
    // playlist_items references playlists via a FK + ON DELETE CASCADE.
    // We must disable foreign keys to rename the table, because SQLite does not
    // allow renaming a table that is the target of a FK in another table while
    // FKs are enforced.
    // Toggle OUTSIDE transaction — pragma is a no-op inside one.
    await db.execAsync(`PRAGMA foreign_keys = OFF`);

    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE playlists_v2 (
          id         TEXT PRIMARY KEY NOT NULL,
          profile_id TEXT,
          name       TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
        );
      `);

      if (hasV1Data && mainProfileId) {
        await db.runAsync(
          `INSERT INTO playlists_v2 (id, profile_id, name, created_at, updated_at)
           SELECT id, ?, name, created_at, updated_at FROM playlists`,
          [mainProfileId],
        );
      } else {
        // No V1 data: copy playlists without a profile (should be empty anyway,
        // but be safe).
        await db.execAsync(
          `INSERT INTO playlists_v2 (id, profile_id, name, created_at, updated_at)
           SELECT id, NULL, name, created_at, updated_at FROM playlists`,
        );
      }

      await db.execAsync(`DROP TABLE playlists`);
      await db.execAsync(`ALTER TABLE playlists_v2 RENAME TO playlists`);

      // Verify FK integrity before committing.
      const violations = await db.getAllAsync<{ table: string; rowid: number; parent: string; fkid: number }>(
        `PRAGMA foreign_key_check`,
      );
      if (violations.length > 0) {
        throw new Error(
          `V2 migration FK check failed: ${JSON.stringify(violations)}`,
        );
      }
    });

    // Re-enable foreign keys after the rename.
    await db.execAsync(`PRAGMA foreign_keys = ON`);

    await db.execAsync(`PRAGMA user_version = 2`);
    currentVersion = 2;
  }

  // ── Version 2 → 3: Add avatar_key if missing (developer migration fix) ───
  if (currentVersion === 2) {
    try {
      await db.execAsync(`ALTER TABLE profiles ADD COLUMN avatar_key TEXT`);
    } catch {
      // Ignore if it already exists (e.g. from a fresh install that skipped V1)
    }
    await db.execAsync(`PRAGMA user_version = 3`);
    currentVersion = 3;
  }

  // Future migrations: add `if (currentVersion === 3) { … }` blocks here.
  // The final user_version set happens inside each step to allow resuming
  // partial migrations on restart (each step is idempotent via IF NOT EXISTS).
  void currentVersion; // satisfies "variable declared but never read" lint rule.
}

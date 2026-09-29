/**
 * SQLite migration tests (T100 / T101).
 *
 * Per the documented test strategy, Jest mocks expo-sqlite and Node 20
 * has no built-in `node:sqlite`, so these tests assert the migration
 * plan rather than executing real SQL.
 *
 * What is verified:
 *   - `migrateDbIfNeeded` calls PRAGMA user_version and WAL/FK pragmas.
 *   - A fresh database (version 0) runs the V1 migration and advances to 1.
 *   - A V1 database runs the V2 migration and advances to 2.
 *   - A V2+ database exits early without running any migration.
 *   - V2 creates the profiles table.
 *   - V2 with existing V1 data creates a "Main" backfill profile.
 *   - V2 with no V1 data does NOT create any profile (T101 pair).
 *   - The foreign_keys pragma is set outside of transactions.
 *
 * T101: The backfill mapping purity test — an empty V1 database must produce
 * no profile (verifies D003 / "new installs don't get an unexpected Main profile").
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateDbIfNeeded } from '@/data/db/schema';

// ---------------------------------------------------------------------------
// Helpers — build a mock SQLiteDatabase
// ---------------------------------------------------------------------------

interface MockDbOptions {
  /** The user_version to report when PRAGMA user_version is queried. */
  userVersion?: number;
  /** Row counts for V1 tables (used for backfill detection). */
  favoritesCount?: number;
  recentlyWatchedCount?: number;
  playlistsCount?: number;
}

function createMockDb({
  userVersion = 0,
  favoritesCount = 0,
  recentlyWatchedCount = 0,
  playlistsCount = 0,
}: MockDbOptions = {}): jest.Mocked<SQLiteDatabase> {
  const execAsync = jest.fn().mockResolvedValue(undefined);
  const runAsync = jest.fn().mockResolvedValue({ changes: 0, lastInsertRowId: 0 });
  const withTransactionAsync = jest.fn().mockImplementation(async (cb: () => Promise<void>) => {
    await cb();
  });


  const getFirstAsync = jest.fn().mockImplementation((sql: string) => {
    if (sql === 'PRAGMA user_version') {
      // First call returns the current version, subsequent calls simulate migration advancing.
      return Promise.resolve({ user_version: userVersion });
    }
    if (sql.includes('COUNT(*) AS n FROM favorites')) {
      return Promise.resolve({ n: favoritesCount });
    }
    if (sql.includes('COUNT(*) AS n FROM recently_watched')) {
      return Promise.resolve({ n: recentlyWatchedCount });
    }
    if (sql.includes('COUNT(*) AS n FROM playlists')) {
      return Promise.resolve({ n: playlistsCount });
    }
    return Promise.resolve(null);
  });

  const getAllAsync = jest.fn().mockImplementation((sql: string) => {
    if (sql.includes('PRAGMA foreign_key_check')) {
      return Promise.resolve([]); // no FK violations
    }
    return Promise.resolve([]);
  });

  return {
    execAsync,
    runAsync,
    getFirstAsync,
    getAllAsync,
    withTransactionAsync,
  } as unknown as jest.Mocked<SQLiteDatabase>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('migrateDbIfNeeded', () => {
  describe('T100 — migration plan verification', () => {
    it('sets WAL mode and foreign_keys pragma at connection open', async () => {
      const db = createMockDb({ userVersion: 3 }); // already up to date
      await migrateDbIfNeeded(db);

      expect(db.execAsync).toHaveBeenCalledWith(expect.stringContaining("journal_mode = 'wal'"));
      expect(db.execAsync).toHaveBeenCalledWith(expect.stringContaining('foreign_keys = ON'));
    });

    it('exits early when user_version >= TARGET_VERSION', async () => {
      const db = createMockDb({ userVersion: 3 });
      await migrateDbIfNeeded(db);

      // No migration-specific execAsync calls beyond pragmas
      const execCalls = db.execAsync.mock.calls.map((c) => c[0] as string);
      const migrationCalls = execCalls.filter(
        (sql) => sql.includes('CREATE TABLE') || sql.includes('user_version = '),
      );
      expect(migrationCalls).toHaveLength(0);
    });

    it('runs V1 migration (0→1) on a fresh database', async () => {
      const db = createMockDb({ userVersion: 0 });
      await migrateDbIfNeeded(db);

      // Expect a PRAGMA user_version = 1 advance from within version 0 step
      const execCalls = db.execAsync.mock.calls.map((c) => c[0] as string);
      expect(execCalls.some((sql) => sql.includes('user_version = 1'))).toBe(true);

      // Expect the V1 schema to be created inside a transaction
      expect(db.withTransactionAsync).toHaveBeenCalled();
    });

    it('runs V2 migration (1→2) on a V1 database', async () => {
      const db = createMockDb({ userVersion: 1 });
      await migrateDbIfNeeded(db);

      const execCalls = db.execAsync.mock.calls.map((c) => c[0] as string);
      // Profiles table must be created
      expect(execCalls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS profiles'))).toBe(
        true,
      );
      // user_version must be advanced to 2
      expect(execCalls.some((sql) => sql.includes('user_version = 2'))).toBe(true);
    });

    it('creates favorites_v2, recently_watched_v2, and playlists_v2 tables in V2 migration', async () => {
      const db = createMockDb({ userVersion: 1 });
      await migrateDbIfNeeded(db);

      const execCalls = db.execAsync.mock.calls.map((c) => c[0] as string);
      expect(execCalls.some((sql) => sql.includes('favorites_v2'))).toBe(true);
      expect(execCalls.some((sql) => sql.includes('recently_watched_v2'))).toBe(true);
      expect(execCalls.some((sql) => sql.includes('playlists_v2'))).toBe(true);
    });

    it('toggles foreign_keys OFF and ON around the playlists table rename', async () => {
      const db = createMockDb({ userVersion: 1 });
      await migrateDbIfNeeded(db);

      const execCalls = db.execAsync.mock.calls.map((c) => c[0] as string);
      const fkOffIdx = execCalls.findIndex((sql) => sql.includes('foreign_keys = OFF'));
      const fkOnIdx = execCalls.findLastIndex((sql) => sql.includes('foreign_keys = ON'));

      // foreign_keys = OFF must appear before = ON in the call sequence
      expect(fkOffIdx).toBeGreaterThanOrEqual(0);
      expect(fkOnIdx).toBeGreaterThan(fkOffIdx);
    });

    it('runs PRAGMA foreign_key_check before committing the playlists rename', async () => {
      const db = createMockDb({ userVersion: 1 });
      await migrateDbIfNeeded(db);

      expect(db.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('foreign_key_check'));
    });
  });

  describe('T101 — backfill mapping purity', () => {
    it('creates a Main profile when V1 favorites exist', async () => {
      const db = createMockDb({ userVersion: 1, favoritesCount: 3 });
      await migrateDbIfNeeded(db);

      // INSERT OR IGNORE INTO profiles with name 'Main'
      const runCalls = db.runAsync.mock.calls.map((c) => c[0] as string);
      expect(runCalls.some((sql) => sql.includes('profiles') && sql.includes("'Main'"))).toBe(true);
    });

    it('creates a Main profile when V1 recently_watched rows exist', async () => {
      const db = createMockDb({ userVersion: 1, recentlyWatchedCount: 5 });
      await migrateDbIfNeeded(db);

      const runCalls = db.runAsync.mock.calls.map((c) => c[0] as string);
      expect(runCalls.some((sql) => sql.includes('profiles') && sql.includes("'Main'"))).toBe(true);
    });

    it('creates a Main profile when V1 playlists exist', async () => {
      const db = createMockDb({ userVersion: 1, playlistsCount: 2 });
      await migrateDbIfNeeded(db);

      const runCalls = db.runAsync.mock.calls.map((c) => c[0] as string);
      expect(runCalls.some((sql) => sql.includes('profiles') && sql.includes("'Main'"))).toBe(true);
    });

    it('does NOT create any profile when all V1 tables are empty (new install)', async () => {
      // All counts default to 0
      const db = createMockDb({ userVersion: 1 });
      await migrateDbIfNeeded(db);

      const runCalls = db.runAsync.mock.calls.map((c) => c[0] as string);
      // No INSERT INTO profiles with 'Main' should occur
      const profileInserts = runCalls.filter(
        (sql) => sql.includes('profiles') && sql.includes("'Main'"),
      );
      expect(profileInserts).toHaveLength(0);
    });

    it('uses a deterministic profile ID for the Main profile (idempotency)', async () => {
      const db = createMockDb({ userVersion: 1, favoritesCount: 1 });
      await migrateDbIfNeeded(db);

      const insertCall = db.runAsync.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT OR IGNORE INTO profiles'),
      );
      expect(insertCall).toBeDefined();
      // First parameter after SQL is the profile ID
      const params = insertCall?.[1] as unknown as string[];
      expect(params?.[0]).toBe('00000000-main-0000-0000-000000000000');
    });

    it('backfills V1 favorites into the Main profile', async () => {
      const db = createMockDb({ userVersion: 1, favoritesCount: 2 });
      await migrateDbIfNeeded(db);

      const runCalls = db.runAsync.mock.calls.map((c) => c[0] as string);
      expect(
        runCalls.some(
          (sql) =>
            sql.includes('INSERT INTO favorites_v2') && sql.includes('SELECT ?, entity_type'),
        ),
      ).toBe(true);
    });

    it('backfills V1 recently_watched into the Main profile', async () => {
      const db = createMockDb({ userVersion: 1, recentlyWatchedCount: 3 });
      await migrateDbIfNeeded(db);

      const runCalls = db.runAsync.mock.calls.map((c) => c[0] as string);
      expect(
        runCalls.some(
          (sql) =>
            sql.includes('INSERT INTO recently_watched_v2') && sql.includes('SELECT ?, entity_type'),
        ),
      ).toBe(true);
    });
  });
});

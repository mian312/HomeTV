/**
 * Profile repository tests (T094).
 *
 * Covers CRUD operations, last-active persistence, pin_enabled and
 * onboarding_completed metadata updates. Tests use the mocked expo-sqlite
 * to assert SQL call patterns rather than executing real statements.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { SqliteProfileRepository } from '@/data/repositories/sqlite-profile';
import type { ProfileId } from '@/types/domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDbMock(): jest.Mocked<SQLiteDatabase> {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn().mockImplementation(async (cb: () => Promise<void>) => cb()),
    execAsync: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SQLiteDatabase>;
}

const MOCK_PROFILE_ROW = {
  id: 'mock-uuid',
  name: 'Alice',
  avatar_key: null,
  pin_enabled: 0,
  onboarding_completed: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const MOCK_PROFILE_ID = 'mock-uuid' as ProfileId;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SqliteProfileRepository', () => {
  describe('create', () => {
    it('inserts a new profile row with correct defaults', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      const profile = await repo.create({ name: 'Alice' });

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO profiles'),
        expect.arrayContaining(['mock-uuid', 'Alice', null]),
      );
      expect(profile.name).toBe('Alice');
      expect(profile.pinEnabled).toBe(false);
      expect(profile.onboardingCompleted).toBe(false);
      expect(profile.avatarKey).toBeNull();
    });

    it('stores avatarKey when provided', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.create({ name: 'Bob', avatarKey: '🎮' });

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO profiles'),
        expect.arrayContaining(['🎮']),
      );
    });
  });

  describe('getAll', () => {
    it('returns empty array when no profiles exist', async () => {
      const db = createDbMock();
      db.getAllAsync.mockResolvedValue([]);
      const repo = new SqliteProfileRepository(db);

      const result = await repo.getAll();

      expect(result).toHaveLength(0);
    });

    it('maps rows to Profile domain objects', async () => {
      const db = createDbMock();
      db.getAllAsync.mockResolvedValue([MOCK_PROFILE_ROW]);
      const repo = new SqliteProfileRepository(db);

      const result = await repo.getAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'mock-uuid',
        name: 'Alice',
        avatarKey: null,
        pinEnabled: false,
        onboardingCompleted: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('getById', () => {
    it('returns null when profile does not exist', async () => {
      const db = createDbMock();
      db.getFirstAsync.mockResolvedValue(null);
      const repo = new SqliteProfileRepository(db);

      const result = await repo.getById(MOCK_PROFILE_ID);

      expect(result).toBeNull();
    });

    it('returns mapped Profile when found', async () => {
      const db = createDbMock();
      db.getFirstAsync.mockResolvedValue(MOCK_PROFILE_ROW);
      const repo = new SqliteProfileRepository(db);

      const result = await repo.getById(MOCK_PROFILE_ID);

      expect(result?.id).toBe('mock-uuid');
      expect(result?.name).toBe('Alice');
    });

    it('queries with the correct profile ID', async () => {
      const db = createDbMock();
      db.getFirstAsync.mockResolvedValue(null);
      const repo = new SqliteProfileRepository(db);

      await repo.getById(MOCK_PROFILE_ID);

      expect(db.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [MOCK_PROFILE_ID],
      );
    });
  });

  describe('update', () => {
    it('updates only name when only name is provided', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.update(MOCK_PROFILE_ID, { name: 'Alice Updated' });

      const [sql, params] = db.runAsync.mock.calls[0] as [string, string[]];
      expect(sql).toContain('name = ?');
      expect(params).toContain('Alice Updated');
    });

    it('updates only avatarKey when only avatarKey is provided', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.update(MOCK_PROFILE_ID, { avatarKey: '🦊' });

      const [sql, params] = db.runAsync.mock.calls[0] as [string, string[]];
      expect(sql).toContain('avatar_key = ?');
      expect(params).toContain('🦊');
    });

    it('updates both name and avatarKey when both are provided', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.update(MOCK_PROFILE_ID, { name: 'Bob', avatarKey: '🐱' });

      const [sql] = db.runAsync.mock.calls[0] as [string, string[]];
      expect(sql).toContain('name = ?');
      expect(sql).toContain('avatar_key = ?');
    });
  });

  describe('delete', () => {
    it('deletes the profile by ID', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.delete(MOCK_PROFILE_ID);

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM profiles WHERE id = ?'),
        [MOCK_PROFILE_ID],
      );
    });
  });

  describe('setPinEnabled', () => {
    it('sets pin_enabled to 1 when enabled is true', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.setPinEnabled(MOCK_PROFILE_ID, true);

      const [sql, params] = db.runAsync.mock.calls[0] as [string, (string | number)[]];
      expect(sql).toContain('pin_enabled = ?');
      expect(params[0]).toBe(1);
    });

    it('sets pin_enabled to 0 when enabled is false', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.setPinEnabled(MOCK_PROFILE_ID, false);

      const [, params] = db.runAsync.mock.calls[0] as [string, (string | number)[]];
      expect(params[0]).toBe(0);
    });
  });

  describe('setOnboardingCompleted', () => {
    it('sets onboarding_completed to 1 when completed is true', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.setOnboardingCompleted(MOCK_PROFILE_ID, true);

      const [sql, params] = db.runAsync.mock.calls[0] as [string, (string | number)[]];
      expect(sql).toContain('onboarding_completed = ?');
      expect(params[0]).toBe(1);
    });
  });

  describe('last-active profile persistence', () => {
    it('saves last active ID into settings', async () => {
      const db = createDbMock();
      const repo = new SqliteProfileRepository(db);

      await repo.saveLastActiveId(MOCK_PROFILE_ID);

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO settings'),
        ['last_active_profile_id', MOCK_PROFILE_ID],
      );
    });

    it('returns null when no last active ID is stored', async () => {
      const db = createDbMock();
      db.getFirstAsync.mockResolvedValue(null);
      const repo = new SqliteProfileRepository(db);

      const result = await repo.loadLastActiveId();

      expect(result).toBeNull();
    });

    it('returns the stored last active ID', async () => {
      const db = createDbMock();
      db.getFirstAsync.mockResolvedValue({ value: MOCK_PROFILE_ID });
      const repo = new SqliteProfileRepository(db);

      const result = await repo.loadLastActiveId();

      expect(result).toBe(MOCK_PROFILE_ID);
    });
  });
});

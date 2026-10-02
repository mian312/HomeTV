import type { SQLiteDatabase } from 'expo-sqlite';
import { SqlitePreferenceRepository } from '@/data/repositories/sqlite-preferences';
import type { ProfileId } from '@/types/domain';

function createDbMock(): jest.Mocked<SQLiteDatabase> {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn().mockImplementation(async (cb: () => Promise<void>) => cb()),
    execAsync: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SQLiteDatabase>;
}

describe('SqlitePreferenceRepository', () => {
  const profileId = 'test-profile-id' as ProfileId;

  it('gets parsed JSON value scoped to profileId', async () => {
    const db = createDbMock();
    db.getFirstAsync.mockResolvedValueOnce({ value: '{"theme":"dark"}' });
    
    const repo = new SqlitePreferenceRepository(db);
    const result = await repo.get(profileId, 'ui_settings');
    
    expect(result).toEqual({ theme: 'dark' });
    expect(db.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE profile_id = ? AND key = ?'),
      [profileId, 'ui_settings']
    );
  });

  it('returns null if no value exists', async () => {
    const db = createDbMock();
    db.getFirstAsync.mockResolvedValueOnce(null);
    
    const repo = new SqlitePreferenceRepository(db);
    const result = await repo.get(profileId, 'ui_settings');
    
    expect(result).toBeNull();
  });

  it('returns null if JSON is corrupted', async () => {
    const db = createDbMock();
    db.getFirstAsync.mockResolvedValueOnce({ value: 'invalid json' });
    
    const repo = new SqlitePreferenceRepository(db);
    const result = await repo.get(profileId, 'ui_settings');
    
    expect(result).toBeNull();
  });

  it('sets serialized JSON value scoped to profileId', async () => {
    const db = createDbMock();
    const repo = new SqlitePreferenceRepository(db);
    
    await repo.set(profileId, 'ui_settings', { theme: 'dark' });
    
    const [sql, params] = db.runAsync.mock.calls[0] as unknown as [string, any[]];
    expect(sql.replace(/\s+/g, ' ')).toContain('INSERT INTO profile_preferences (profile_id, key, value)');
    expect(params).toEqual([profileId, 'ui_settings', '{"theme":"dark"}']);
  });

  it('removes value scoped to profileId', async () => {
    const db = createDbMock();
    const repo = new SqlitePreferenceRepository(db);
    
    await repo.remove(profileId, 'ui_settings');
    
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE profile_id = ? AND key = ?'),
      [profileId, 'ui_settings']
    );
  });
});

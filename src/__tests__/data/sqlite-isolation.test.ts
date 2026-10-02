import type { SQLiteDatabase } from 'expo-sqlite';
import { SqliteFavoritesRepository } from '@/data/repositories/sqlite-favorites';
import { SqliteRecentlyWatchedRepository } from '@/data/repositories/sqlite-recently-watched';
import { SqlitePlaylistRepository } from '@/data/repositories/sqlite-playlists';
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

describe('SQLite Profile Isolation (SQL Assertions)', () => {
  const profileId = 'test-profile-id' as ProfileId;

  it('favorites repository scopes reads and writes by profileId', async () => {
    const db = createDbMock();
    const repo = new SqliteFavoritesRepository(db);

    // Read isolation
    await repo.getAll(profileId);
    let sqlCalls = db.getAllAsync.mock.calls.map(c => c[0] as string);
    let paramsCalls = db.getAllAsync.mock.calls.map(c => c[1] as unknown as string[]);
    
    expect(sqlCalls[0]).toContain('WHERE profile_id = ?');
    expect(paramsCalls[0]).toContain(profileId);

    // Write isolation
    const ref = { entityType: 'channel' as const, entityId: 'c1' };
    await repo.add(profileId, ref);
    
    let runSqlCalls = db.runAsync.mock.calls.map(c => c[0] as string);
    let runParamsCalls = db.runAsync.mock.calls.map(c => c[1] as unknown as string[]);
    
    expect(runSqlCalls[0]).toContain('INSERT OR IGNORE INTO favorites');
    expect(runParamsCalls[0]).toContain(profileId);

    await repo.remove(profileId, ref);
    
    expect(db.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining('WHERE profile_id = ? AND entity_type = ? AND entity_id = ?'),
      [profileId, 'channel', 'c1']
    );
  });

  it('recently watched repository scopes reads and writes by profileId', async () => {
    const db = createDbMock();
    const repo = new SqliteRecentlyWatchedRepository(db);

    // Read isolation
    await repo.getAll(profileId);
    let sqlCalls = db.getAllAsync.mock.calls.map(c => c[0] as string);
    let paramsCalls = db.getAllAsync.mock.calls.map(c => c[1] as unknown as string[]);
    
    expect(sqlCalls[0]).toContain('WHERE profile_id = ?');
    expect(paramsCalls[0]).toContain(profileId);

    // Write isolation
    const ref = { entityType: 'channel' as const, entityId: 'c2' };
    await repo.record(profileId, ref);
    
    let runSqlCalls = db.runAsync.mock.calls.map(c => c[0] as string);
    let runParamsCalls = db.runAsync.mock.calls.map(c => c[1] as unknown as string[]);
    
    // The first query in record() is the INSERT
    expect(runSqlCalls[0]).toContain('INSERT INTO recently_watched');
    expect(runParamsCalls[0]).toContain(profileId);

    // The third query in record() is the DELETE to keep the cap at 20, which MUST also be scoped!
    const thirdSql = runSqlCalls[2].replace(/\s+/g, ' ');
    expect(thirdSql).toContain('DELETE FROM recently_watched WHERE profile_id = ?');
    expect(runParamsCalls[2]).toContain(profileId);
  });

  it('playlists repository scopes reads and writes by profileId', async () => {
    const db = createDbMock();
    const repo = new SqlitePlaylistRepository(db);

    // Read isolation
    await repo.getAll(profileId);
    let sqlCalls = db.getAllAsync.mock.calls.map(c => c[0] as string);
    let paramsCalls = db.getAllAsync.mock.calls.map(c => c[1] as unknown as string[]);
    
    expect(sqlCalls[0]).toContain('WHERE profile_id = ?');
    expect(paramsCalls[0]).toContain(profileId);

    // Write isolation
    await repo.create(profileId, 'My Playlist');
    
    let runSqlCalls = db.runAsync.mock.calls.map(c => c[0] as string);
    let runParamsCalls = db.runAsync.mock.calls.map(c => c[1] as unknown as string[]);
    
    expect(runSqlCalls[0]).toContain('INSERT INTO playlists (id, profile_id');
    expect(runParamsCalls[0]).toContain(profileId);

    // Update isolation
    db.runAsync.mockClear();
    await repo.rename(profileId, 'p1', 'Updated');
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ? AND profile_id = ?'),
      expect.arrayContaining(['Updated', 'p1', profileId])
    );

    // Delete isolation
    db.runAsync.mockClear();
    await repo.delete(profileId, 'p1');
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM playlists WHERE id = ? AND profile_id = ?'),
      ['p1', profileId]
    );
  });
});

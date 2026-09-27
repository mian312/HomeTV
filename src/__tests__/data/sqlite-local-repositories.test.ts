import type { SQLiteDatabase } from 'expo-sqlite';

import { SqliteFavoritesRepository } from '@/data/repositories/sqlite-favorites';
import { SqliteRecentlyWatchedRepository } from '@/data/repositories/sqlite-recently-watched';

function createDatabaseMock() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  } as unknown as jest.Mocked<SQLiteDatabase>;
}

describe('SQLite local repositories', () => {
  it('persists and hydrates favorites through the repository boundary', async () => {
    const db = createDatabaseMock();
    const repository = new SqliteFavoritesRepository(db);
    const ref = { entityType: 'channel' as const, entityId: 'channel-1' };
    db.getFirstAsync.mockResolvedValue({ count: 1 });
    db.getAllAsync.mockResolvedValue([
      { entity_type: 'channel', entity_id: 'channel-1', created_at: 1000 },
    ]);

    await repository.add(ref);

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO favorites'),
      ['channel', 'channel-1', expect.any(Number)],
    );
    await expect(repository.isFavorite(ref)).resolves.toBe(true);
    await expect(repository.getAll()).resolves.toEqual([
      { entityRef: ref, createdAt: new Date(1000) },
    ]);

    await repository.remove(ref);
    expect(db.runAsync).toHaveBeenLastCalledWith(
      'DELETE FROM favorites WHERE entity_type = ? AND entity_id = ?',
      ['channel', 'channel-1'],
    );
  });

  it('records and hydrates recently watched timestamps through the repository boundary', async () => {
    const db = createDatabaseMock();
    const repository = new SqliteRecentlyWatchedRepository(db);
    db.getAllAsync.mockResolvedValue([
      { entity_type: 'channel', entity_id: 'channel-1', watched_at: 2000 },
    ]);

    await repository.record({ entityType: 'channel', entityId: 'channel-1' });

    expect(db.runAsync).toHaveBeenCalledTimes(3);
    expect(db.runAsync.mock.calls[0][0]).toContain('ON CONFLICT(entity_type, entity_id)');
    expect(db.runAsync.mock.calls[2][0]).toContain('ORDER BY watched_at DESC');
    await expect(repository.getAll()).resolves.toEqual([
      { entityRef: { entityType: 'channel', entityId: 'channel-1' }, watchedAt: new Date(2000) },
    ]);
  });
});
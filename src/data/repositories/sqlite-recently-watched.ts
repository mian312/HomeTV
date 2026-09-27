import type { SQLiteDatabase } from 'expo-sqlite';

import type { EntityRef, RecentlyWatchedEntry } from '@/types/domain';
import type { RecentlyWatchedRepository } from './repositories';

const MAX_HISTORY = 20;

export class SqliteRecentlyWatchedRepository implements RecentlyWatchedRepository {
  constructor(private db: SQLiteDatabase) {}

  async record(ref: EntityRef): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      'INSERT INTO recently_watched (entity_type, entity_id, watched_at) VALUES (?, ?, ?) ON CONFLICT(entity_type, entity_id) DO UPDATE SET watched_at = excluded.watched_at',
      [ref.entityType, ref.entityId, now],
    );

    // Enforce max history limit
    await this.db.runAsync(
      `DELETE FROM recently_watched 
       WHERE entity_type = ? 
         AND entity_id = ? 
         AND watched_at < (
           SELECT watched_at FROM recently_watched 
           ORDER BY watched_at DESC 
           LIMIT 1 OFFSET ?
         )`,
      [ref.entityType, ref.entityId, MAX_HISTORY - 1], // Keep only top N items
    );

    // Better general trim (if we want global limit regardless of type):
    await this.db.runAsync(
      `DELETE FROM recently_watched 
       WHERE rowid NOT IN (
         SELECT rowid FROM recently_watched 
         ORDER BY watched_at DESC 
         LIMIT ?
       )`,
      [MAX_HISTORY],
    );
  }

  async getAll(): Promise<readonly RecentlyWatchedEntry[]> {
    const rows = await this.db.getAllAsync<{
      entity_type: string;
      entity_id: string;
      watched_at: number;
    }>('SELECT entity_type, entity_id, watched_at FROM recently_watched ORDER BY watched_at DESC');

    return rows.map((row) => ({
      entityRef: {
        entityType: row.entity_type as any,
        entityId: row.entity_id,
      },
      watchedAt: new Date(row.watched_at),
    }));
  }

  async clear(): Promise<void> {
    await this.db.runAsync('DELETE FROM recently_watched');
  }
}

import type { SQLiteDatabase } from 'expo-sqlite';

import type { EntityRef, ProfileId, RecentlyWatchedEntry } from '@/types/domain';
import type { RecentlyWatchedRepository } from './repositories';

const MAX_HISTORY = 20;

export class SqliteRecentlyWatchedRepository implements RecentlyWatchedRepository {
  constructor(private db: SQLiteDatabase) {}

  async record(profileId: ProfileId, ref: EntityRef): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      'INSERT INTO recently_watched (profile_id, entity_type, entity_id, watched_at) VALUES (?, ?, ?, ?) ON CONFLICT(profile_id, entity_type, entity_id) DO UPDATE SET watched_at = excluded.watched_at',
      [profileId, ref.entityType, ref.entityId, now],
    );

    // Enforce max history limit
    await this.db.runAsync(
      `DELETE FROM recently_watched 
       WHERE profile_id = ?
         AND entity_type = ? 
         AND entity_id = ? 
         AND watched_at < (
           SELECT watched_at FROM recently_watched 
           WHERE profile_id = ?
           ORDER BY watched_at DESC 
           LIMIT 1 OFFSET ?
         )`,
      [profileId, ref.entityType, ref.entityId, profileId, MAX_HISTORY - 1], // Keep only top N items
    );

    // Better general trim for this profile
    await this.db.runAsync(
      `DELETE FROM recently_watched 
       WHERE profile_id = ? AND rowid NOT IN (
         SELECT rowid FROM recently_watched 
         WHERE profile_id = ?
         ORDER BY watched_at DESC 
         LIMIT ?
       )`,
      [profileId, profileId, MAX_HISTORY],
    );
  }

  async getAll(profileId: ProfileId): Promise<readonly RecentlyWatchedEntry[]> {
    const rows = await this.db.getAllAsync<{
      entity_type: string;
      entity_id: string;
      watched_at: number;
    }>('SELECT entity_type, entity_id, watched_at FROM recently_watched WHERE profile_id = ? ORDER BY watched_at DESC', [profileId]);

    return rows.map((row) => ({
      entityRef: {
        entityType: row.entity_type as any,
        entityId: row.entity_id,
      },
      watchedAt: new Date(row.watched_at),
    }));
  }

  async clear(profileId: ProfileId): Promise<void> {
    await this.db.runAsync('DELETE FROM recently_watched WHERE profile_id = ?', [profileId]);
  }
}

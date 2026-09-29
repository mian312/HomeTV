import type { SQLiteDatabase } from 'expo-sqlite';

import type { EntityRef, Favorite, ProfileId } from '@/types/domain';
import type { FavoritesRepository } from './repositories';

export class SqliteFavoritesRepository implements FavoritesRepository {
  constructor(private db: SQLiteDatabase) {}

  async add(profileId: ProfileId, ref: EntityRef): Promise<void> {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO favorites (profile_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?)',
      [profileId, ref.entityType, ref.entityId, Date.now()],
    );
  }

  async remove(profileId: ProfileId, ref: EntityRef): Promise<void> {
    await this.db.runAsync('DELETE FROM favorites WHERE profile_id = ? AND entity_type = ? AND entity_id = ?', [
      profileId,
      ref.entityType,
      ref.entityId,
    ]);
  }

  async isFavorite(profileId: ProfileId, ref: EntityRef): Promise<boolean> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM favorites WHERE profile_id = ? AND entity_type = ? AND entity_id = ?',
      [profileId, ref.entityType, ref.entityId],
    );
    return (row?.count ?? 0) > 0;
  }

  async getAll(profileId: ProfileId): Promise<readonly Favorite[]> {
    const rows = await this.db.getAllAsync<{
      entity_type: string;
      entity_id: string;
      created_at: number;
    }>('SELECT entity_type, entity_id, created_at FROM favorites WHERE profile_id = ? ORDER BY created_at DESC', [profileId]);

    return rows.map((row) => ({
      entityRef: {
        entityType: row.entity_type as any, // Currently 'channel', type bounds enforced at boundary
        entityId: row.entity_id,
      },
      createdAt: new Date(row.created_at),
    }));
  }
}

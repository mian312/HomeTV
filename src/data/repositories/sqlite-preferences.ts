import type { SQLiteDatabase } from 'expo-sqlite';
import type { ProfileId } from '@/types/domain';
import type { PreferenceRepository } from './repositories';

export class SqlitePreferenceRepository implements PreferenceRepository {
  constructor(private db: SQLiteDatabase) {}

  async get<T>(profileId: ProfileId, key: string): Promise<T | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      `SELECT value FROM profile_preferences WHERE profile_id = ? AND key = ?`,
      [profileId, key],
    );
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(profileId: ProfileId, key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.db.runAsync(
      `INSERT INTO profile_preferences (profile_id, key, value) VALUES (?, ?, ?)
       ON CONFLICT(profile_id, key) DO UPDATE SET value = excluded.value`,
      [profileId, key, serialized],
    );
  }

  async remove(profileId: ProfileId, key: string): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM profile_preferences WHERE profile_id = ? AND key = ?`,
      [profileId, key],
    );
  }
}

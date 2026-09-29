import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Profile, ProfileId } from '@/types/domain';
import type { ProfileRepository } from './repositories';

const LAST_ACTIVE_PROFILE_KEY = 'last_active_profile_id';

interface ProfileRow {
  id: string;
  name: string;
  avatar_key: string | null;
  pin_enabled: number;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id as ProfileId,
    name: row.name,
    avatarKey: row.avatar_key,
    pinEnabled: row.pin_enabled === 1,
    onboardingCompleted: row.onboarding_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteProfileRepository implements ProfileRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(params: { name: string; avatarKey?: string | null }): Promise<Profile> {
    const id = Crypto.randomUUID() as ProfileId;
    const now = new Date().toISOString();

    // Workaround: older Android SQLite (<3.35) cannot DROP COLUMN, so we must satisfy legacy NOT NULLs if they exist.
    const tableInfo = await this.db.getAllAsync<{ name: string }>('PRAGMA table_info(profiles)');
    const hasInitials = tableInfo.some((c) => c.name === 'avatar_initials');
    const hasColorToken = tableInfo.some((c) => c.name === 'avatar_color_token');

    let query = `INSERT INTO profiles (id, name, avatar_key, pin_enabled, onboarding_completed, created_at, updated_at`;
    let values = `VALUES (?, ?, ?, 0, 0, ?, ?`;
    const bindParams: any[] = [id, params.name, params.avatarKey ?? null, now, now];

    if (hasInitials) {
      query += `, avatar_initials`;
      values += `, ?`;
      bindParams.push(params.name.charAt(0).toUpperCase() || '?');
    }
    if (hasColorToken) {
      query += `, avatar_color_token`;
      values += `, ?`;
      bindParams.push('primary'); // Dummy value
    }

    query += `)`;
    values += `)`;

    await this.db.runAsync(`${query} ${values}`, bindParams);

    return {
      id,
      name: params.name,
      avatarKey: params.avatarKey ?? null,
      pinEnabled: false,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAll(): Promise<readonly Profile[]> {
    const rows = await this.db.getAllAsync<ProfileRow>(
      `SELECT id, name, avatar_key, pin_enabled, onboarding_completed, created_at, updated_at
       FROM profiles
       ORDER BY created_at ASC`,
    );
    return rows.map(rowToProfile);
  }

  async getById(profileId: ProfileId): Promise<Profile | null> {
    const row = await this.db.getFirstAsync<ProfileRow>(
      `SELECT id, name, avatar_key, pin_enabled, onboarding_completed, created_at, updated_at
       FROM profiles
       WHERE id = ?`,
      [profileId],
    );
    return row ? rowToProfile(row) : null;
  }

  async update(
    profileId: ProfileId,
    params: { name?: string; avatarKey?: string | null },
  ): Promise<void> {
    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];

    if (params.name !== undefined) {
      updates.push('name = ?');
      values.push(params.name);
    }
    if (params.avatarKey !== undefined) {
      updates.push('avatar_key = ?');
      values.push(params.avatarKey);
    }

    values.push(profileId);
    await this.db.runAsync(
      `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
  }

  async delete(profileId: ProfileId): Promise<void> {
    // ON DELETE CASCADE on favorites, recently_watched, and playlists
    // (playlists CASCADE to playlist_items) handles scoped data automatically.
    await this.db.runAsync(`DELETE FROM profiles WHERE id = ?`, [profileId]);
  }

  async setPinEnabled(profileId: ProfileId, enabled: boolean): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE profiles SET pin_enabled = ?, updated_at = ? WHERE id = ?`,
      [enabled ? 1 : 0, now, profileId],
    );
  }

  async setOnboardingCompleted(profileId: ProfileId, completed: boolean): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE profiles SET onboarding_completed = ?, updated_at = ? WHERE id = ?`,
      [completed ? 1 : 0, now, profileId],
    );
  }

  async saveLastActiveId(profileId: ProfileId): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [LAST_ACTIVE_PROFILE_KEY, profileId],
    );
  }

  async loadLastActiveId(): Promise<ProfileId | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      `SELECT value FROM settings WHERE key = ?`,
      [LAST_ACTIVE_PROFILE_KEY],
    );
    return row ? (row.value as ProfileId) : null;
  }
}

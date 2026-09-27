import type { SQLiteDatabase } from 'expo-sqlite';

import type { SettingsRepository } from './repositories';

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  async get<T>(key: string, defaultValue: T): Promise<T> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );

    if (!row) {
      return defaultValue;
    }

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, stringValue],
    );
  }

  async remove(key: string): Promise<void> {
    await this.db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
  }
}

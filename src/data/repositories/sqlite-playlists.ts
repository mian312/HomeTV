import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

import type { EntityRef, Playlist, PlaylistItem } from '@/types/domain';
import type { PlaylistRepository } from './repositories';

export class SqlitePlaylistRepository implements PlaylistRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(name: string): Promise<Playlist> {
    const id = Crypto.randomUUID();
    const now = Date.now();
    await this.db.runAsync(
      'INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [id, name, now, now],
    );

    return {
      id,
      name,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async rename(playlistId: string, name: string): Promise<void> {
    await this.db.runAsync('UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?', [
      name,
      Date.now(),
      playlistId,
    ]);
  }

  async delete(playlistId: string): Promise<void> {
    // ON DELETE CASCADE will handle playlist_items
    await this.db.runAsync('DELETE FROM playlists WHERE id = ?', [playlistId]);
  }

  async getAll(): Promise<readonly Playlist[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      name: string;
      created_at: number;
      updated_at: number;
    }>('SELECT * FROM playlists ORDER BY updated_at DESC');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getById(playlistId: string): Promise<Playlist | null> {
    const row = await this.db.getFirstAsync<{
      id: string;
      name: string;
      created_at: number;
      updated_at: number;
    }>('SELECT * FROM playlists WHERE id = ?', [playlistId]);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async addItem(playlistId: string, ref: EntityRef): Promise<void> {
    const maxPosRow = await this.db.getFirstAsync<{ max_pos: number | null }>(
      'SELECT MAX(position) as max_pos FROM playlist_items WHERE playlist_id = ?',
      [playlistId],
    );
    const nextPosition = (maxPosRow?.max_pos ?? -1) + 1;

    const now = Date.now();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO playlist_items (playlist_id, entity_type, entity_id, position, added_at) VALUES (?, ?, ?, ?, ?)',
        [playlistId, ref.entityType, ref.entityId, nextPosition, now],
      );
      await this.db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', [now, playlistId]);
    });
  }

  async removeItem(playlistId: string, ref: EntityRef): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        'DELETE FROM playlist_items WHERE playlist_id = ? AND entity_type = ? AND entity_id = ?',
        [playlistId, ref.entityType, ref.entityId],
      );
      await this.db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', [
        Date.now(),
        playlistId,
      ]);
    });
  }

  async getItems(playlistId: string): Promise<readonly PlaylistItem[]> {
    const rows = await this.db.getAllAsync<{
      playlist_id: string;
      entity_type: string;
      entity_id: string;
      position: number;
      added_at: number;
    }>('SELECT * FROM playlist_items WHERE playlist_id = ? ORDER BY position ASC', [playlistId]);

    return rows.map((row) => ({
      playlistId: row.playlist_id,
      entityRef: {
        entityType: row.entity_type as any,
        entityId: row.entity_id,
      },
      position: row.position,
      addedAt: new Date(row.added_at),
    }));
  }
}

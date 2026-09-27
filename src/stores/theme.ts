/**
 * Theme mode store — Zustand (transient application state).
 *
 * Manages the user's theme preference (light / dark / system).
 *
 * Currently persisted via AsyncStorage. This will be migrated to the
 * SQLite settings repository (SettingsRepository) once T006/T007 are
 * complete, and AsyncStorage will be removed.
 */

import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

import { settingsRepository } from '@/data/db';

/** The three theme modes supported by HomeTV. */
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** The currently active theme mode. */
  mode: ThemeMode;
  /** Set the theme mode. */
  setMode: (mode: ThemeMode) => void;
}

const sqliteStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await settingsRepository.get<string | null>(name, null);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await settingsRepository.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await settingsRepository.remove(name);
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => sqliteStorage),
    },
  ),
);

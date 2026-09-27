/**
 * Theme mode store — Zustand (transient application state).
 *
 * Manages the user's theme preference (light / dark / system).
 *
 * Currently persisted via AsyncStorage. This will be migrated to the
 * SQLite settings repository (SettingsRepository) once T006/T007 are
 * complete, and AsyncStorage will be removed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The three theme modes supported by HomeTV. */
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** The currently active theme mode. */
  mode: ThemeMode;
  /** Set the theme mode. */
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

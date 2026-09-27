/**
 * Root application providers.
 *
 * Wraps the app tree with all required context providers in the correct
 * order. This is used by the root `_layout.tsx` so that route screens
 * and their feature hooks have access to:
 *
 * - TanStack QueryClientProvider (remote data / cache)
 * - Expo Router ThemeProvider (navigation theme)
 *
 * Future providers (SQLite database context, etc.) will be added here
 * as their tasks are implemented.
 */

import React, { Suspense, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SQLiteProvider } from 'expo-sqlite';

import { createQueryClient } from '@/lib/query-client';
import { useThemeStore } from '@/stores/theme';
import { migrateDbIfNeeded } from '@/data/db/schema';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeStore((state) => state.mode);

  const resolvedScheme = themeMode === 'system' ? systemColorScheme : themeMode;

  return (
    <Suspense fallback={null}>
      <SQLiteProvider databaseName="hometv.db" onInit={migrateDbIfNeeded} useSuspense>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

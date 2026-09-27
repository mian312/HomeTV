# HomeTV — Current Project State

This is a verified implementation snapshot. `tasks.md` is the task/history record; `../README.md` is the product and architecture guide.

## Overview

- Product: HomeTV, a free mobile-first OTT/IPTV app for Android and iOS.
- Initial catalog source: iptv-org via `@iptv-org/sdk`.
- Current project: Expo Router starter at the repository root with architecture boundaries defined; HomeTV feature implementation is not complete.
- Expo SDK: `~57.0.25`.
- React Native: `0.86.3`; React `19.2.3`; TypeScript `~6.0.3`.
- TypeScript strict mode: enabled.

## Current milestone and next task

- Phase: 1 — project architecture established.
- Last completed task: T002 establish project architecture.
- Next planned task: T003 establish theme/design system.

## Implemented architecture

### Domain types (`src/types/domain.ts`)

- Branded ID types: `ChannelId`, `CategoryId`, `CountryCode`, `LanguageCode`.
- Domain models: `Channel`, `Stream`, `Category`, `Country`, `Language`, `GuideEntry`.
- Local-only entities: `EntityRef` (type+ID for favorites/playlists), `Playlist`, `PlaylistItem`, `RecentlyWatchedEntry`, `Favorite`.
- `AsyncState<T>` discriminated union for loading/success/empty/error states.

### Provider interface (`src/data/providers/provider.ts`)

- `IptvProvider` interface with methods: `getChannels()`, `getStreams()`, `getAllStreams()`, `getCategories()`, `getCountries()`, `getLanguages()`, `getGuide()`.
- `ProviderError` class with typed error codes (`NETWORK`, `NOT_FOUND`, `PARSE`, `UNKNOWN`).
- No concrete implementation yet (T008).

### Repository interfaces (`src/data/repositories/repositories.ts`)

- `FavoritesRepository`: add, remove, isFavorite, getAll.
- `RecentlyWatchedRepository`: record (capped at 20, deduplicates, moves to top), getAll, clear.
- `PlaylistRepository`: create, rename, delete, getAll, getById, addItem, removeItem, getItems.
- `SettingsRepository`: get (with default), set, remove.
- No concrete implementations yet (T007).

### TanStack Query client (`src/lib/query-client.ts`)

- `createQueryClient()` with cache-first defaults: 5 min stale time, 30 min GC time, 2 retries, refetch on reconnect.
- Feature-specific query keys and options are defined alongside their feature hooks.

### Root providers (`src/lib/providers.tsx`)

- `AppProviders` composes QueryClientProvider and Expo Router ThemeProvider.
- Resolves theme mode (light/dark/system) using the theme store.
- Root `_layout.tsx` uses `AppProviders` instead of inline provider setup.

### Theme store (`src/stores/theme.ts`)

- Moved from `src/store/theme.ts` to `src/stores/theme.ts` (plural, per project structure).
- `ThemeMode` is now a strict union (`'light' | 'dark' | 'system'`) instead of `ColorSchemeName | 'system'`.
- Still persisted via AsyncStorage (migration to SQLite SettingsRepository deferred to T007).

### Theme hook (`src/hooks/use-theme.ts`)

- Enhanced to return `ThemeResult` object with `colors`, `scheme` (`ResolvedScheme`), and `isDark`.
- `ThemeColors` type widened for compatibility with `as const` light/dark palettes.
- All components updated from `useTheme()` direct color access to `useTheme().colors`.

### Updated components

- `app-tabs.tsx` / `app-tabs.web.tsx`: Use `useTheme()` hook instead of raw `Colors + useColorScheme`.
- `themed-text.tsx`, `themed-view.tsx`, `theme-toggle.tsx`, `collapsible.tsx`: Destructure `{ colors }` from `useTheme()`.
- `theme-toggle.tsx`: Added `accessibilityRole` and `accessibilityLabel`.

## Routes currently present

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/explore.tsx`

All routes beyond these are planned, not implemented.

## Data/state plan

- TanStack Query: remote IPTV/EPG server state, retries, stale/cache policy, background refresh.
- Zustand: transient UI/application state.
- SQLite: durable favorites, recently watched (maximum 20), playlists/items, settings, and anonymous local identity.
- Provider models and SQLite row types must not escape their data boundary into UI.

## Not implemented yet

- Complete theme tokens (typography, radii, elevation, motion).
- Reusable OTT UI components.
- SQLite database client, schema/migrations, and repository implementations.
- iptv-org provider adapter (concrete `IptvProvider` implementation).
- Domain data mapping from SDK types.
- HomeTV-specific query hooks and cache policies.
- Home/channel/search/favorites/history/playlist/EPG screens and business logic.
- Isolated video player, fallback, and player error UX.
- Jest configuration, test files, and `@testing-library/react-native` setup.
- Full accessibility/performance/device validation.

## Known issues and limitations

- The starter home screen remains.
- AsyncStorage currently persists theme state and should be migrated as part of local settings work.
- Theme tokens are incomplete (only basic colors and spacing).
- Tests have no current test files/configuration.
- IPTV streams may be unavailable or unsuitable for a given device or jurisdiction; availability is dynamic.

## Recovery checklist

Before continuing: read `AGENTS.md`, this file, `tasks.md`, run `git status` and inspect recent `git log`, then review relevant source. Source code and current package manifests are authoritative if this snapshot becomes stale.

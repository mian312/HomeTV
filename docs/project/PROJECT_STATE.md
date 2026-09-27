# HomeTV — Current Project State

This is a verified implementation snapshot. `tasks.md` is the task/history record; `../README.md` is the product and architecture guide.

## Overview

- Product: HomeTV, a free mobile-first OTT/IPTV app for Android and iOS.
- Initial catalog source: iptv-org via `@iptv-org/sdk`.
- Current project: Expo Router starter with architecture boundaries and complete design system; HomeTV feature implementation is not complete.
- Expo SDK: `~57.0.25`.
- React Native: `0.86.3`; React `19.2.3`; TypeScript `~6.0.3`.
- TypeScript strict mode: enabled.

## Current milestone and next task

- Phase: 8 — End-to-End Integration and Validation.
- Last completed task: T029 Automated test pass.
- Next planned task: T031 Final documentation checkpoint.

## Implemented design system (`src/constants/theme.ts`)

### Colors (`Colors`)

Full semantic, scheme-aware palette with 30+ tokens per scheme:

- **Core text**: `text`, `textSecondary`, `textTertiary`, `textInverse`
- **Backgrounds**: `background`, `backgroundElement`, `backgroundSelected`, `backgroundElevated`
- **Primary/accent**: `primary`, `primaryText`, `primaryMuted`
- **Surfaces**: `surface`, `surfaceSecondary`, `surfaceTertiary`
- **Borders**: `border`, `borderMuted`
- **Semantic states**: `success`/`successMuted`, `warning`/`warningMuted`, `error`/`errorMuted`
- **Overlays**: `overlay`, `scrim`
- **Player**: `playerBackground`, `playerText`, `playerControl`, `playerControlMuted`
- **Tab bar**: `tabBarBackground`, `tabBarActive`, `tabBarInactive`
- **Icons**: `icon`, `iconSecondary`

### Typography (`Typography`)

13 named presets: `displayLarge`, `displaySmall`, `headlineLarge`, `headlineSmall`, `titleLarge`, `titleSmall`, `body`, `bodySmall`, `caption`, `overline`, `code`, `button`, `tabLabel`.

Each preset includes fontFamily, fontSize, lineHeight, fontWeight, and letterSpacing.

### Spacing (`Spacing`)

Semantic scale: `xxs` (2), `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (20), `xxl` (24), `xxxl` (32), `huge` (48), `massive` (64). Legacy aliases (`half`, `one`, `two`, etc.) preserved for backward compat.

### Radius (`Radius`)

7 levels: `none` (0), `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (24), `full` (9999).

### Elevation (`Elevation`)

5 cross-platform shadow presets: `none`, `sm`, `md`, `lg`, `xl`. Each includes shadowColor/offset/opacity/radius and Android elevation.

### Motion (`Motion`)

Timing presets: `fast` (150ms), `normal` (250ms), `slow` (400ms). Spring configs: `spring` (bouncy), `springTight` (snappy).

### Layout constants

`BottomTabInset`, `MaxContentWidth`, `MinTouchTarget` (48dp accessibility minimum).

## Theme hook (`src/hooks/use-theme.ts`)

`useTheme()` returns `ThemeResult` with: `colors`, `scheme`, `isDark`, `typography`, `spacing`, `radius`, `elevation`, `motion`. Components use this as their single entry point for all design tokens.

## Theme-aware components

- **`ThemedText`**: Supports new `variant` prop (maps to Typography presets) alongside legacy `type` prop for backward compat.
- **`ThemedView`**: Simplified to use `ThemeColor` for background, removed unused `lightColor`/`darkColor` props.
- **`ThemeToggleWrapper`**: Uses Elevation, Radius, Spacing, and MinTouchTarget tokens. Accessibility role/label set.

## Architecture (from T002)

- **Domain types** (`src/types/domain.ts`): Branded IDs, domain models, `AsyncState<T>`.
- **Provider interface** (`src/data/providers/provider.ts`): `IptvProvider` + `ProviderError`.
- **iptv-org Provider** (`src/data/providers/iptv-org/index.ts`): Concrete implementation and domain mapping logic.
- **Repository interfaces** (`src/data/repositories/repositories.ts`): Favorites, RecentlyWatched, Playlist, Settings.
- **SQLite Database** (`src/data/db/index.ts`): Global connection sharing via `expo-sqlite`.
- **Database Migrations** (`src/data/db/schema.ts`): Explicit versioned initialization (`migrateDbIfNeeded`) creating `settings`, `favorites`, `recently_watched`, `playlists`, and `playlist_items` tables.
- **Local Repositories** (`src/data/repositories/sqlite-*.ts`): Implementations mapping SQLite rows to domain entities.
- **Query client & hooks** (`src/lib/query-client.ts`, `src/data/queries/iptv.ts`): Cache-first defaults and data hooks like `useChannels`.
- **Root providers** (`src/lib/providers.tsx`): `AppProviders` (SQLiteProvider + QueryClient + ThemeProvider).
- **Theme store** (`src/stores/theme.ts`): `ThemeMode` ('light' | 'dark' | 'system'), persisted via custom Zustand adapter backed by the SQLite `SettingsRepository`.

## Routes currently present

- `src/app/_layout.tsx`
- `src/app/(tabs)/index.tsx` (Home screen with categorized horizontal lists)
- `src/app/(tabs)/channels.tsx` (Channels screen with grid, search, and filtering)
- `src/app/(tabs)/library.tsx` (Library screen with favorites, history, playlist creation/overview, and playlist detail)
- `src/app/player/[channelId].tsx` (Channel playback route)
- `src/app/(tabs)/_layout.tsx` (Tab group nested under the root player stack)

All routes beyond these are planned, not implemented. TV guide access is a channel-card action, not a separate tab or route.

## Player

- `src/features/player/use-player-session.ts` owns Expo Video lifecycle, stream loading/failover, NetInfo status, and playback events.
- `src/features/player/player-source.ts` maps stream headers and HLS URLs to Expo Video source options.
- `src/components/player/channel-video-player.tsx` provides playback controls, timeline seeking, error/retry states, double-tap/swipe gestures, and fullscreen orientation handling.
- Channel cards open `/player/[channelId]`; route and player responsibilities are isolated from data fetching and provider details.

## Playlist feature

- Playlists are created from the Library or while adding a channel.
- Channel cards open a playlist picker to add or remove that channel; a count indicates how many playlists contain it.
- The Library overview shows each playlist's channel count and up to four channel-logo previews.
- Opening a playlist shows its channels as rows with separate play and remove controls. Launching playback directly from a playlist row works correctly.
- Playlist list, membership, and preview data use shared TanStack Query caches backed by the SQLite playlist repository.

## Channel details and guide

- Channel cards expose a details action with the channel's available metadata.
- A labeled Guide button on each channel card opens a draggable bottom sheet; dragging down or tapping outside closes it.
- The sheet defaults to the next 24 hours and offers completed programs from the past three days and programs in the next seven days.
- The currently airing program is highlighted with a LIVE badge beside its title.
- Guide entries are deterministic mock data spanning the selected windows until a live EPG source is integrated.

## Playlist detail presentation

- Opening a playlist uses the same draggable bottom-sheet presentation as the channel guide.
- Playlist details show the first three channel avatars and a `+N` overflow avatar, followed by the full removable channel list.

## Reusable UI Foundation (`src/components/ui/`)

- Built without NativeWind to respect our design system tokens natively.
- Components include `Button`, `Badge`, `Card`, `PressableCard`, `Input`, `Separator`, `Skeleton`, `SectionHeader`, and explicit state views (`LoadingView`, `EmptyView`, `ErrorView`, `OfflineView`).
- Exported via a single barrel file `src/components/ui/index.ts`.
- Uses Reanimated for press scale animations and Skeleton pulse effects.

## Quality Tooling

- Configured Jest, React Native Testing Library v13 (using built-in matchers).
- Manual mocks established for `expo-router`, `react-native-reanimated`, and `expo-splash-screen`.
- Basic unit tests covering UI components and theme hooks.
- Code formatting set via `.prettierrc` matching project styles.

## Not implemented yet

- Physical device validation for iOS/Android (currently blocked by environment constraints).

## Known issues and limitations

- Legacy Spacing aliases and `type` prop in ThemedText are kept for backward compat.
- EPG schedules are deterministic mock data, not listings from a live guide provider.
- Channel logos are joined from the iptv-org logos feed; broken URLs fall back to channel initials.
- Fullscreen and device orientation have static/test validation only; physical Android/iOS behavior still needs device testing.
- Expo Doctor reports the existing `@types/jest` 30.0.0 differs from the Expo SDK 57 expected 29.5.14; `tsc`, lint, and Jest pass.
- IPTV streams may be unavailable or unsuitable for a given device or jurisdiction; availability is dynamic.

## Recovery checklist

Before continuing: read `AGENTS.md`, this file, `tasks.md`, run `git status` and inspect recent `git log`, then review relevant source. Source code and current package manifests are authoritative if this snapshot becomes stale.

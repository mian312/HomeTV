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

- Phase: 2 — data foundation and sqlite start.
- Last completed task: T005 establish quality tooling.
- Next planned task: T006 establish SQLite foundation.

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
- **Repository interfaces** (`src/data/repositories/repositories.ts`): Favorites, RecentlyWatched, Playlist, Settings.
- **Query client** (`src/lib/query-client.ts`): Cache-first defaults.
- **Root providers** (`src/lib/providers.tsx`): `AppProviders` (QueryClient + ThemeProvider).
- **Theme store** (`src/stores/theme.ts`): `ThemeMode` ('light' | 'dark' | 'system'), persisted via AsyncStorage (migrate to SQLite in T007).

## Routes currently present

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/explore.tsx`

All routes beyond these are planned, not implemented.

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

- SQLite database client, schema/migrations, and repository implementations.
- iptv-org provider adapter (concrete `IptvProvider` implementation).
- Domain data mapping from SDK types.
- HomeTV-specific query hooks and cache policies.
- Home/channel/search/favorites/history/playlist/EPG screens and business logic.
- Isolated video player, fallback, and player error UX.
- Full accessibility/performance/device validation.

## Known issues and limitations

- The starter home screen remains.
- AsyncStorage currently persists theme state (migration deferred to T007).
- Legacy Spacing aliases and `type` prop in ThemedText are kept for starter backward compat; will be removed when starter UI is replaced.
- Tests have no current test files/configuration.
- IPTV streams may be unavailable or unsuitable for a given device or jurisdiction; availability is dynamic.

## Recovery checklist

Before continuing: read `AGENTS.md`, this file, `tasks.md`, run `git status` and inspect recent `git log`, then review relevant source. Source code and current package manifests are authoritative if this snapshot becomes stale.

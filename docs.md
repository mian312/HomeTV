# HomeTV Project Guide

## Purpose and current status

HomeTV is a local-first OTT/IPTV mobile application for Android and iOS. The initial catalog provider is iptv-org through `@iptv-org/sdk`. The architecture should leave room for Android TV/tvOS, remote-control input, additional providers, and a backend, without implementing those future capabilities in V1.

This is a working Expo Router starter with HomeTV dependencies installed, not a completed HomeTV app. The current home route is still starter UI. The existing app is at the repository root, not in a `mobile/` subfolder.

Verified baseline from the current workspace:

- Expo SDK `~57.0.25`, React Native `0.86.3`, React `19.2.3`.
- TypeScript strict mode is enabled in `tsconfig.json`.
- Expo Router is configured as the entry point (`expo-router/entry`).
- `expo-sqlite`, `expo-video`, `expo-image`, orientation, keep-awake, NetInfo, Reanimated, Gesture Handler, vector icons, TanStack Query, Zustand, and `@iptv-org/sdk` are present in `package.json`.
- Jest and `jest-expo` are installed, but no test files or Jest config were found. `@testing-library/react-native` is not installed.
- AsyncStorage is installed and currently persists the Zustand theme store. This conflicts with the intended storage policy below; migrate theme preference persistence to the SQLite settings repository before removing AsyncStorage.
- The theme currently has light/dark colors and spacing, but does not yet provide the full token system required below.
- No HomeTV feature repositories, provider adapter, SQLite migration/schema, query client, EPG, playlist, or player implementation was found during this assessment.

Treat `package.json`, the lockfile, and installed SDK as the source of truth. Expo package versions change with SDK releases. Before changing Expo/React Native APIs, review the installed SDK's versioned official documentation and check compatibility with `npx expo install`.

## Product scope

### V1

- Android and iOS mobile application.
- iptv-org catalog/data through an integration boundary.
- Local favorites, recently watched, playlists, settings, and anonymous local identity in SQLite.
- Browse and search channels, browse countries/languages/categories/networks, and a guide/EPG foundation.
- A resilient live player using `expo-video`, including playback state, retry, and alternate streams where available.
- Local-first/cached data behavior, accessible UI, and behavior-focused tests.

### Explicitly deferred

Do not build or install packages for these until requested as scoped work:

- M3U import/provider and Xtream Codes.
- A custom backend, authentication, cloud sync, Firebase, or Supabase.
- Ads, monetization, analytics, Sentry, or other error-monitoring SDKs.
- Full Android TV/tvOS UX and remote-control navigation.
- Unneeded storage libraries such as AsyncStorage. The existing theme-store usage is a migration exception to clean up, not a recommended pattern.

Stream availability is dynamic. Do not imply that a stream is playable, permanently online, or legally usable in every jurisdiction.

## Architecture and state ownership

```text
Route / Screen
    ↓
Feature UI + feature hook
    ↓
Application service / domain logic
    ↓
Repository interface
   ↙                 ↘
SQLite repository    IPTV provider adapter
(local state)        (@iptv-org/sdk)
                         ↓
                  HomeTV domain models
```

The UI depends on HomeTV domain models and repository/feature interfaces, not raw SQLite rows or SDK objects. Map external data at the integration boundary so another provider or backend can be added later.

| Concern | Owner | Examples |
| --- | --- | --- |
| Remote/server state | TanStack Query | Catalog, channels, streams, EPG, request lifecycle, retry, stale/cache policy |
| Transient client state | Zustand | Player overlay, temporary filters, theme mode before persistence integration, sheets/modals |
| Durable local state | SQLite (`expo-sqlite`) | Favorites, history, playlists/items, settings, anonymous local identity |
| Provider-specific access | Provider adapter/repository | `@iptv-org/sdk` calls and conversion to domain models |
| Navigation | Expo Router | Route files under `src/app/` |

Do not persist every query indiscriminately or copy the entire IPTV catalog into SQLite. Prefer cache-first rendering and refresh remotely in the background. Persist only explicitly selected query data if/when required.

## Target project structure

This is the intended structure as features are added. It is not a requirement to create empty folders up front. Preserve the current Expo Router `src/app/` convention and extend the existing template where practical.

```text
HomeTV/
├── .agents/
│   ├── rules/hometv-architecture.md
│   ├── workflows/hometv-phase.md
│   └── skills/hometv-expo-engineering/SKILL.md
├── assets/
├── docs.md
├── src/
│   ├── app/                         # Expo Router routes only
│   │   ├── _layout.tsx
│   │   ├── (tabs)/                  # Home, channels, guide, favorites
│   │   ├── search/
│   │   ├── channel/[channelId].tsx
│   │   ├── player/[channelId].tsx
│   │   ├── playlists/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/                      # Shared primitives
│   │   ├── layout/
│   │   ├── channel/
│   │   ├── player/
│   │   └── common/
│   ├── features/
│   │   ├── channels/
│   │   ├── favorites/
│   │   ├── recently-watched/
│   │   ├── search/
│   │   ├── epg/
│   │   ├── playlists/
│   │   ├── player/
│   │   └── settings/
│   ├── data/
│   │   ├── providers/iptv-org/      # SDK adapter and mapping
│   │   ├── repositories/            # Repository implementations/interfaces
│   │   └── database/                # SQLite client, schema, migrations
│   ├── stores/                      # Zustand transient app state
│   ├── lib/                          # Query client, theme, shared infrastructure
│   ├── types/                        # Shared domain types only
│   ├── constants/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── app.json
├── package.json
└── tsconfig.json
```

Ownership guidance:

- Route files compose feature screens and navigation; keep domain logic and SQL out of routes.
- Feature-owned hooks, services, types, and utilities belong under their feature when they are feature-specific.
- Shared UI belongs under `src/components/`; search for an existing component before creating another with the same responsibility.
- Provider and persistence implementation details belong under `src/data/`; do not leak those types to components.
- Use `FlatList` or `SectionList` for large channel collections. Do not render thousands of rows with `Array.map()`.

## Domain and feature requirements

### Channels and provider

- Define typed HomeTV domain models for channels, streams, categories, countries, languages, networks, and guide entries as needed.
- Inspect the installed SDK types and behavior before mapping; do not guess SDK object shape.
- `IptvOrgProvider` is the first provider implementation. Screens and feature hooks must not import SDK collection/model types directly.
- Keep the mapping/repository contract open to a future M3U, Xtream, or backend provider, but do not implement those now.

### Search and browsing

- Search behavior is independent from screen rendering and supports All, Channels, Languages, Countries, Categories, and Networks.
- Channel browsing supports all channels, favorites, recently watched, and country/language/category filters.
- Use virtualized lists, stable keys, and memoized/appropriately deferred expensive filtering when profiling justifies it.
- Every async list flow has loading, success, empty, and error states.

### Favorites, history, and playlists

- Favorites use an entity type plus entity ID, allowing later support for shows/programs/episodes without redesigning around channels only.
- Recently watched stores at most 20 entries. Watching an item updates its timestamp, deduplicates/moves it to the top, and trims overflow.
- Playlists and playlist items persist in SQLite. Items reference entity IDs instead of duplicating entire provider objects.
- Use repositories (for example `favoritesRepository.add/remove/getAll`) rather than SQL in screens.

### EPG / guide

- Map provider guide data to a HomeTV EPG domain model before it reaches UI.
- The architecture should support current/upcoming programs, channel timelines, and program details. V1 may start with a simpler guide.

### Player and network resilience

- Isolate player lifecycle and controls behind a controlled API based on `expo-video`; keep it separate from route screens.
- Support loading/buffering, play/pause, mute, fullscreen, retry, and stream fallback as the player phase is implemented.
- Try available alternate streams after failure. If all fail, show a useful error and retry/return action; never leave a blank player.
- Use NetInfo to distinguish offline state from a failed IPTV stream. Do not blame network connectivity without evidence.
- Orientation, keep-awake, PiP, gestures, and animations should be added in their planned phases and checked against the installed SDK documentation.

## Theme, UI, and accessibility

- Provide typed light, dark, and system theme modes.
- Centralize tokens for colors, typography, spacing, radius, elevation, and motion. Components consume tokens rather than scattering literal colors and dimensions.
- Use `expo-image` for logos/artwork with appropriate sizing, caching, placeholder, and error handling.
- Use large touch targets and appropriate `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` for interactive controls.
- Keep domain/input behavior independent of touch so keyboard, focus, and D-pad support can be added in the presentation layer later.
- Prefer restrained OTT-style animation; use existing Reanimated/Gesture Handler dependencies only when the feature requires them.

## Database policy

- Use `expo-sqlite` through one centralized database client and repositories.
- Introduce schema changes as migrations; centralize initialization and handle failures explicitly.
- Initial tables when their features are implemented: `users`, `favorites`, `recently_watched`, `playlists`, `playlist_items`, `settings`.
- Do not create speculative EPG/catalog cache tables until an actual persistence requirement is defined.
- Store IDs and compact app-owned state rather than full SDK objects whenever practical. Use parameterized SQL and transactions where needed.

## Dependency policy

### Installed baseline (verified in `package.json`)

- Expo / platform: `expo` 57.0.25, `expo-router` 57.0.23, React 19.2.3, React Native 0.86.3, TypeScript 6.0.3.
- Expo modules include `expo-video`, `expo-sqlite`, `expo-image`, `expo-screen-orientation`, `expo-keep-awake`, `expo-status-bar`, `expo-constants`, `expo-linking`, and `expo-splash-screen`.
- UI/platform support includes `@expo/vector-icons`, `react-native-gesture-handler`, `react-native-reanimated`, `@react-native-community/netinfo`.
- Data/state includes `@iptv-org/sdk`, `@tanstack/react-query`, and `zustand`.
- Quality tooling includes ESLint, `eslint-config-expo`, Prettier, Jest, and `jest-expo`.

Do not pin those versions from this document when upgrading. Follow the actual project lockfile and use `npx expo install` for Expo/React Native packages.

### Gaps to track

- Add `@testing-library/react-native` and a Jest configuration when establishing the testing phase; Jest packages alone do not mean tests are configured.
- Review AsyncStorage theme persistence. Migrate it to a settings repository backed by SQLite, then remove AsyncStorage only after verifying no remaining consumers.
- Complete the token-based theme system and wire it consistently into shared UI.
- Do not add libraries for features explicitly deferred above.

## Delivery phases

Work one phase at a time using `.agents/workflows/hometv-phase.md`. Inspect the real workspace first and state scope/files before edits.

0. Workspace/dependency assessment.
1. Expo foundation: strict TypeScript, root providers, typed theme tokens.
2. Reusable UI primitives and theme-aware components.
3. SQLite client, migrations, and local repositories.
4. iptv-org provider adapter and domain mapping.
5. TanStack Query setup and explicit per-dataset cache policy.
6. Data-driven Home sections.
7. Channel browsing, filtering, and search.
8. Favorites and recently watched.
9. Local playlists.
10. EPG/TV Guide.
11. Isolated video player.
12. Stream fallback and error handling.
13. Player gestures and animations.
14. Measure and optimize performance.
15. Behavior-focused test coverage.
16. Android/iOS validation.

For every implementation phase: inspect existing code; keep changes scoped; run typecheck, lint, and relevant tests; report results and gaps. Do not generate the whole application in one pass.

## Commands

Run from the repository root unless noted. These validation commands do not start Metro:

```powershell
npx expo install --check
npx expo-doctor
npx expo lint
npx tsc --noEmit
```

Run the test suite only after Jest configuration and tests exist:

```powershell
npx jest --runInBand
```

Do not run `npx expo start`, launch a simulator/device, or create a native build unless explicitly requested. When a user asks to run the app, use the project's documented start script and SDK-matching guidance.

## Done means

A phase is complete only when its requested behavior is implemented in the correct layer, typed without disabling strict checks, covered by appropriate tests where relevant, validated with available static checks, and summarized with verified outcomes. Do not claim runtime validation unless the app was actually run.

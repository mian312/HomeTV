# HomeTV Project Guide

## Purpose and current status

HomeTV is a local-first OTT/IPTV mobile application for Android and iOS. The initial catalog provider is iptv-org through `@iptv-org/sdk`. Architecture should remain ready for Android TV/tvOS, remote input, additional providers, and a backend without implementing these future capabilities prematurely.

The repository contains an Expo Router starter with HomeTV dependencies installed, not a completed HomeTV product. The Expo app is at the repository root. The home route remains starter UI.

### Verified baseline

- Expo SDK `~57.0.25`, React Native `0.86.3`, React `19.2.3`.
- TypeScript strict mode is enabled.
- Expo Router is configured as the application entry point.
- Expo Video, SQLite, Image, screen orientation, keep-awake, status bar, constants, linking, splash screen, Gesture Handler, Reanimated, NetInfo, vector icons, TanStack Query, Zustand, and `@iptv-org/sdk` are installed.
- Jest and `jest-expo` are installed. No test files or Jest configuration are present; `@testing-library/react-native` is not installed.
- AsyncStorage is installed and currently persists Zustand theme state. Migrate this preference to the SQLite settings repository before removing AsyncStorage.
- The existing theme has basic light/dark colors and spacing, but not all required design tokens.
- HomeTV-specific provider adapters, repositories, SQLite migrations, query client/provider, guide, playlists, and player implementation remain unimplemented.

Treat `package.json`, the lockfile, and installed SDK as the source of truth. Expo packages change across SDKs. Before changing Expo/React Native APIs, review documentation for the installed SDK and verify compatibility with `npx expo install`.

For the implementation snapshot and task queue, see [project/PROJECT_STATE.md](project/PROJECT_STATE.md) and [project/tasks.md](project/tasks.md).

## Product scope

### V1

- Android and iOS mobile app.
- iptv-org catalog/data behind an integration boundary.
- SQLite persistence for favorites, recently watched, playlists/items, settings, and local anonymous identity.
- Channel browse/search and country/language/category/network filtering.
- EPG/TV Guide foundation.
- Resilient live player using `expo-video`, with loading, errors, retries, and alternate streams when available.
- Cache-first data behavior, accessible UI, and behavior-focused tests.

### V2 — Profiles & Personalization

- Multiple local profiles with a profile selector, creation, editing, and deletion.
- All existing local data (favorites, recently watched, playlists) scoped per profile, with existing V1 data migrated rather than lost.
- Local profile lock using a PIN. The PIN is never stored in plaintext; the verifier lives in secure device storage behind an authentication abstraction so device biometrics/passcode can be added later.
- Per-profile onboarding for country, language, category, and home-section preferences.
- Local, on-device personalization: recommendation scoring, a personalized Home, and Browse defaults.

V2 is planned and tracked as T033–T103 in [project/tasks.md](project/tasks.md). None of it is implemented yet; V1 remains the current state of the application.

### Explicitly deferred

Do not implement or install packages for these unless explicitly requested as scoped work:

- M3U import/provider and Xtream Codes.
- Custom backend, server-side authentication, accounts, cloud sync, Firebase, or Supabase.
- Ads, monetization, analytics, Sentry, or other monitoring SDKs.
- Full Android TV/tvOS UX and remote-control navigation.
- Unneeded storage libraries such as AsyncStorage (currently present as a theme persistence migration item).

V2's PIN is a **local, device-local profile lock only**. It is not a backend account, not server authentication, and not a cloud identity, and it does not change the deferrals above. Personalization is computed on device from local data only; no analytics or tracking is introduced.

Stream availability is dynamic. Never imply a stream is guaranteed playable, permanently online, or legally usable in every jurisdiction.

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

The UI depends on HomeTV domain models and application/repository interfaces, not raw SQLite rows or SDK objects. Map external data at integration boundaries so providers or a backend can be changed without rewriting screens.

| Concern | Owner | Examples |
| --- | --- | --- |
| Remote/server state | TanStack Query | Catalog, channels, streams, EPG, request lifecycle, retry, cache policy |
| Transient client state | Zustand | Player UI, temporary filters, sheets/modals, transient theme mode |
| Durable local state | SQLite (`expo-sqlite`) | Favorites, history, playlists/items, settings, anonymous local identity |
| Provider access | Provider adapter/repository | SDK calls and mapping to domain models |
| Navigation | Expo Router | Route files under `src/app/` |

Prefer cache-first rendering with background refresh. Persist only selected data; do not dump the full IPTV dataset into SQLite or persist every query indiscriminately.

## Target project structure

This is a target structure to grow into, not a requirement to create empty folders. Preserve the existing Expo Router `src/app/` convention and add feature areas as work is implemented.

```text
HomeTV/
├── .agents/
│   ├── rules/hometv-architecture.md
│   ├── workflows/hometv-phase.md
│   └── skills/hometv-expo-engineering/SKILL.md
├── docs/
│   ├── README.md                    # Product/architecture guide (this file)
│   └── project/
│       ├── PROJECT_STATE.md         # Verified current implementation snapshot
│       └── tasks.md                 # Task queue and history
├── assets/
├── src/
│   ├── app/                         # Expo Router route files only
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
│   │   ├── providers/iptv-org/      # SDK adapter and model mapping
│   │   ├── repositories/            # Interfaces and implementations
│   │   └── database/                # SQLite client, schema, migrations
│   ├── stores/                      # Zustand transient application state
│   ├── lib/                         # Query client, theme, infrastructure
│   ├── types/                       # Shared domain types
│   ├── constants/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── AGENTS.md                        # AI operating contract + Expo rules
├── app.json
├── package.json
└── tsconfig.json
```

Ownership:

- Route files compose screens/navigation; keep business logic and SQL out of routes.
- Feature-owned hooks, services, types, and utilities belong under their feature.
- Shared reusable UI belongs under `src/components/`; search for existing components before adding overlapping ones.
- Provider and persistence implementation details belong under `src/data/`; do not leak their types into UI.
- Use `FlatList`/`SectionList` for large channel datasets. Do not render thousands of rows with `Array.map()`.

## Domain and feature requirements

### Channels and providers

- Define HomeTV domain models for channels, streams, categories, countries, languages, networks, and guide entries as needed.
- Inspect installed SDK types before mapping; do not guess SDK model shapes.
- `IptvOrgProvider` is the initial adapter. UI and feature hooks must not import raw SDK model types.
- Leave repository/provider contracts ready for future providers, but do not implement M3U, Xtream, or backend providers in V1.

### Search and browsing

- Search supports All, Channels, Languages, Countries, Categories, and Networks, independently of screen rendering.
- Channel browsing supports all channels, favorites, recently watched, and country/language/category filters.
- Use virtualized lists, stable keys, and measured optimization for expensive filtering.
- Async list flows include loading, success, empty, and error states.

### Favorites, history, and playlists

- Favorites use entity type plus entity ID, allowing future non-channel entities.
- Recently watched stores at most 20 entries. Watching an item updates its timestamp, moves it to the top, removes duplicates, and trims overflow.
- Playlists/items persist in SQLite. Items reference entity IDs rather than duplicating provider objects.
- Access persistence through repositories (for example, `favoritesRepository.add/remove/getAll`), not SQL in screens.

### EPG / Guide

- Map provider guide data to a HomeTV domain model before it reaches UI.
- Support future current/upcoming programs, channel timelines, and program details. V1 may begin with a simpler guide.

### Player and network resilience

- Isolate `expo-video` lifecycle and controls behind a controlled player API; keep playback independent of route screens.
- Support loading/buffering, play/pause, mute, fullscreen, retry, and alternate streams as player work is implemented.
- On failure, provide useful error information, retry, and fallback where possible; never leave a blank player.
- Use NetInfo to distinguish offline state from IPTV stream/provider failure. Do not blame the network without evidence.
- Add orientation, keep-awake, PiP, gestures, and animations in their planned phases, checking docs for the installed SDK.

## Theme, UI, and accessibility

- Provide typed light, dark, and system theme modes.
- Centralize tokens for colors, typography, spacing, radii, elevation, and motion. Components use tokens rather than scattering literal colors/dimensions.
- Use `expo-image` for logos/artwork with suitable sizing, caching, placeholders, and error handling.
- Interactive controls need accessible labels, roles, states, and comfortable touch targets.
- Keep domain/input behavior independent of touch so keyboard, focus, and D-pad support can be added in the presentation layer.
- Prefer restrained OTT-style animation; use installed animation/gesture libraries only when a feature needs them.

## Database policy

- Use `expo-sqlite` through a centralized database client and repositories.
- Introduce schema changes with migrations; centralize initialization and handle failures explicitly.
- Initial tables when their features are implemented: `users`, `favorites`, `recently_watched`, `playlists`, `playlist_items`, `settings`.
- V2 adds `profiles` and `profile_preferences`, and introduces `profile_id` on `favorites`, `recently_watched`, and `playlists`. That change requires a table rebuild, so migrations must be a stepwise `user_version` chain rather than a single version check.
- Do not create speculative EPG/catalog cache tables before a real persistence requirement exists.
- Store IDs and compact app-owned state rather than entire SDK objects. Use parameterized SQL and transactions where needed.
- Never persist secrets in SQLite. The profile PIN verifier belongs in secure device storage, with only non-secret metadata in the database.

## Dependency policy

Expo/React Native package versions must follow the current lockfile and installed SDK. Use `npx expo install` for Expo/native packages and ordinary npm installs only for SDK-independent dependencies. Do not add packages for hypothetical future features.

Installed package baseline (verified in `package.json`): Expo `~57.0.25`, Expo Router `~57.0.23`, React `19.2.3`, React Native `0.86.3`, TypeScript `~6.0.3`; relevant installed packages include Expo Video/SQLite/Image/orientation/keep-awake; vector icons, Gesture Handler, Reanimated, NetInfo; `@iptv-org/sdk`, TanStack Query, Zustand; ESLint/Prettier/Jest/`jest-expo`.

Known gaps to resolve in their appropriate phases:

- Add `@testing-library/react-native` and configure Jest when starting the testing phase; installed Jest packages alone do not configure tests.
- Migrate theme persistence from AsyncStorage to a SQLite settings repository, then remove AsyncStorage after confirming no consumer remains.
- Complete full theme tokens and connect them consistently to reusable UI.
- Do not install Redux, Sentry, backend/authentication, M3U/Xtream, ads, or analytics dependencies in advance.

## Delivery phases

Follow `.agents/workflows/hometv-phase.md`, work on one scoped task at a time, and track progress in [project/tasks.md](project/tasks.md). Update the state snapshot in [project/PROJECT_STATE.md](project/PROJECT_STATE.md) when the implementation changes.

0. Workspace/dependency assessment.
1. Expo foundation: strict TypeScript, root providers, typed theme tokens.
2. Reusable UI primitives and theme-aware components.
3. SQLite client, migrations, and local repositories.
4. iptv-org provider adapter and domain mapping.
5. TanStack Query and explicit per-dataset cache policy.
6. Data-driven Home sections.
7. Channel browsing, filtering, and search.
8. Favorites and recently watched.
9. Local playlists.
10. EPG/TV Guide.
11. Isolated video player.
12. Stream fallback and error handling.
13. Player gestures and animation.
14. Measured performance work.
15. Behavior-focused tests.
16. Android/iOS validation.

For each task: inspect relevant code, keep changes scoped, run typecheck/lint/relevant tests, and report verified outcomes and known gaps. Do not implement the entire product in one pass.

## Static validation (does not launch Metro)

Run from the repository root:

```powershell
npx expo install --check
npx expo-doctor
npx expo lint
npx tsc --noEmit
```

Run tests only after test configuration/specs are present:

```powershell
npx jest --runInBand
```

Do not run `npx expo start`, launch a simulator/device, or create a native build unless explicitly requested. Never report runtime validation unless the app was actually run.

## Completion criteria

A task is complete when the requested behavior exists in the correct layer, strict TypeScript remains enabled, relevant behavior is tested where applicable, available static checks pass, and tracking docs accurately reflect the verified result. Do not mark planned behavior as implemented.

# HomeTV — Current Project State

This is a verified implementation snapshot. `tasks.md` is the task/history record; `../README.md` is the product and architecture guide.


## Overview

- Product: HomeTV, a free mobile-first OTT/IPTV app for Android and iOS.
- Initial catalog source: iptv-org via `@iptv-org/sdk`.
- Current project: Expo Router application with architecture boundaries, a complete design system, V1 features implemented, and V2 Phase 9 (Profile Foundation) now complete.
- V2 (Profiles & Personalization) is tracked as T033–T103; Phase 9 (T033–T037) is done; Phase 10 (T038+) is next.
- Expo SDK: `~57.0.25`.
- React Native: `0.86.3`; React `19.2.3`; TypeScript `~6.0.3`.
- TypeScript strict mode: enabled.

## Current milestone and next task

- Current Version: V2 — Profiles & Personalization.
- Current Phase: 12 — Profile Onboarding & Content Preferences.
- Current Task: T056 Home section preferences.
- Last Completed Task: T055 Category preferences.
- Next Planned Task: T056 Home section preferences.
- Critical completed task this phase: T037 Profile-scoped data migration.

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
- All of V2: profiles, profile-scoped data, local PIN authentication, onboarding, and personalization (T033–T103).
- `expo-secure-store` is not yet installed; the PIN verifier store depends on it.
- Real SQLite migration execution in tests. Jest mocks `expo-sqlite` and Node 20 has no `node:sqlite`, so migration tests must assert the migration plan and backfill mapping rather than running the statements.

## Planned V2 direction (not yet implemented)

Recorded here so the next session does not have to reconstruct the plan from `tasks.md` alone. See ADRs D002–D008 in [tasks.md](tasks.md) for the reasoning.

- **Scoping**: `profile_id` is added to `favorites`, `recently_watched`, and `playlists`; it joins the primary key of the first two. This requires a SQLite table rebuild, so the single-version gate in `src/data/db/schema.ts` becomes a stepwise `user_version` chain.
- **Legacy data**: an existing V1 install with data is backfilled into a `Main` profile; an install with no V1 rows gets no profile and enters profile creation instead.
- **Repositories**: every scoped method takes an explicit `profileId` and never reads ambient session state.
- **Caches**: profile-scoped local query keys carry the profile id, and switching profiles removes the previous profile's local cache. The current keys in `src/data/queries/local.ts` are profile-agnostic and are the main cross-profile leak risk.
- **Authentication**: a `ProfileAuthenticator` interface fronts PIN verification, so device authentication can be added later without changing screens. The verifier lives in `expo-secure-store`; SQLite holds `pin_enabled` metadata only.
- **Gating**: the root layout gates on `booting`, `needs-profile`, `locked`, `ready`; profile management remains real routes.
- **Personalization**: preferences default the user without locking them in; an explicit selection always wins.

## V2 Implementation — Phase 9 complete (Profile Foundation)

### Profile domain types (`src/types/domain.ts`)

- `ProfileId` branded type (compile-time safety).
- `ProfileAvatarKey = string` (emoji or initials key, null = use initials).
- `Profile` — full profile model with `id`, `name`, `avatarKey`, `pinEnabled`, `onboardingCompleted`, `createdAt`, `updatedAt`. ISO 8601 strings for timestamps (aligns with SQLite TEXT).
- `ProfileSummary` — lightweight identity model for selector/header rendering.

### SQLite migration chain (`src/data/db/schema.ts`)

- Stepwise `user_version` chain: 0→1 (V1 schema), 1→2 (V2 profile scoping).
- V2 migration: creates `profiles` table; rebuilds `favorites` and `recently_watched` tables with `profile_id` in primary key; adds `profile_id` to `playlists` preserving `playlist_items` FK cascade.
- `PRAGMA foreign_keys` toggled **outside** transactions (SQLite semantics — no-op inside).
- `PRAGMA foreign_key_check` runs before V2 transaction commits.
- Backfill: creates deterministic `00000000-main-0000-0000-000000000000` profile only when V1 rows exist. New installs produce no profile and enter profile creation.

### Profile repository (`src/data/repositories/sqlite-profile.ts`)

- `ProfileRepository` interface in `src/data/repositories/repositories.ts`.
- `SqliteProfileRepository`: create, getAll, getById, update, delete, setPinEnabled, setOnboardingCompleted, saveLastActiveId, loadLastActiveId.
- Registered as `profileRepository` singleton in `src/data/db/index.ts`.
- Every method takes explicit `profileId` — no ambient session state read (ADR D004).

### Session store (`src/stores/session.ts`)

- Zustand store: `SessionPhase` (`booting` | `needs-profile` | `locked` | `ready`).
- `SessionState`: `phase`, `activeProfile`, `lockedProfileId`, `boot()`, `switchProfile()`, `unlock()`, `lock()`, `leaveProfile()`, `refreshActiveProfile()`.
- `BootResult` discriminated union passed to `boot()`.

### Boot hook (`src/features/profile/use-boot-session.ts`)

- `useBootSession()`: runs once after SQLite initialises inside the Suspense boundary.
- Reads last-active profile ID from `profileRepository`, loads profile, calls `boot()` with correct phase.
- Falls back to first available profile if stored ID is gone.

### Root layout session gate (`src/app/_layout.tsx`)

- `SessionGate` component runs `useBootSession()` and watches `phase`.
- `needs-profile` → navigates to `/profile/select`.
- `locked` → navigates to `/profile/unlock`.
- `ready` → stays in tab stack.
- Profile stack declared with `Stack.Screen name="profile"`.

### Profile Routes (`src/app/profile/` and `src/app/(tabs)/profile.tsx`)

- `_layout.tsx` — Stack layout for profile group.
- `select.tsx` — Profile selector (lists profiles, add button, one-tap switch vs PIN switch).
- `create.tsx` — Profile creation (name, optional PIN via `SecureStoreAuthenticator`).
- `edit.tsx` — Profile edit screen (name and avatar modification, PIN actions, delete profile).
- `pin.tsx` — Profile PIN management (set up, change, remove PIN flows).
- `unlock.tsx` — PIN unlock screen with `PinKeypad` and rate-limiting UI feedback.
- `(tabs)/profile.tsx` — Fourth tab rendering all profiles, current active marker, and switch controls.

### Profile PIN Authentication (`src/features/profile/`)

- `pin-authenticator.ts`: Defines `ProfileAuthenticator` interface, `validatePin` pure function, and PIN policy (length 4, max 5 attempts, 30s lockout).
- `secure-store-authenticator.ts`: Concrete implementation using `expo-secure-store` and `expo-crypto` for iterated salted SHA-256 verification.
- Implements in-memory rate limiting and handles constant-time string comparison.
- Exports `profileAuthenticator` singleton for use across the application.

## Known issues and limitations

- Legacy Spacing aliases and `type` prop in ThemedText are kept for backward compat.
- EPG schedules are deterministic mock data, not listings from a live guide provider.
- Channel logos are joined from the iptv-org logos feed; broken URLs fall back to channel initials.
- Fullscreen and device orientation have static/test validation only; physical Android/iOS behavior still needs device testing.
- Expo Doctor reports the existing `@types/jest` 30.0.0 differs from the Expo SDK 57 expected 29.5.14; `tsc`, lint, and Jest pass.
- IPTV streams may be unavailable or unsuitable for a given device or jurisdiction; availability is dynamic.
- **6 pre-existing test failures** in `channel-card.test.tsx` and `ui-components.test.tsx` caused by the `feat: modern OTT UI overhaul` commit changing accessibility labels and rendered text. These tests need selectors updated to match the new UI — they are NOT caused by V2 work.
- V2 migration tests (T100/T101) assert SQL call patterns, not real execution. Migration runtime correctness requires device validation (T102/T103).
- Profile route strings in `router.replace()` are cast with `as any` because Expo Router's typed routes haven't been regenerated yet to include the new `/profile/*` routes.
- T095 (profile isolation tests) depends on T074–T076 repository scoping completion.

## Recovery checklist

Before continuing: read `AGENTS.md`, this file, `tasks.md`, run `git status` and inspect recent `git log`, then review relevant source. Source code and current package manifests are authoritative if this snapshot becomes stale.

# HomeTV — Task Tracker

Detailed task queue and development history. Current implementation truth is in [PROJECT_STATE.md](PROJECT_STATE.md); architecture and product requirements are in [../README.md](../README.md).

**Statuses:** `TODO` · `IN_PROGRESS` · `BLOCKED` · `COMPLETED` · `FAILED` · `SKIPPED`

## Task Table

| ID | Phase | Task | Expected Outcome | Status | Changes Made | Lint/Test Issues | Decisions | Commit | Notes |
|---|---|---|---|---|---|---|---|---|---|
| T001 | 0 | Inspect existing Expo workspace | Workspace and current configuration are understood before changes | COMPLETED | Inspected package/configuration/routes and found SDK 57 starter | Not run (inspection only) | Preserve existing app; don't scaffold another | — | Baseline in PROJECT_STATE.md |
| T002 | 1 | Establish project architecture | Clean feature/domain/data boundaries exist | COMPLETED | Created `src/types/domain.ts` (branded IDs, domain models, AsyncState); `src/data/providers/provider.ts` (IptvProvider interface + ProviderError); `src/data/repositories/repositories.ts` (Favorites/RecentlyWatched/Playlist/Settings interfaces); `src/lib/query-client.ts` (TanStack Query client with cache-first defaults); `src/lib/providers.tsx` (root AppProviders); moved theme store to `src/stores/theme.ts` with stricter ThemeMode type; enhanced `useTheme()` → ThemeResult with colors/scheme/isDark; updated all consumers; wired AppProviders into root layout | `tsc --noEmit` ✓, `expo lint` ✓, `git diff --check` ✓ | Use branded IDs for compile-time safety; widen ThemeColors for `as const` compat; keep AppProviders composition for easy extension | See Git history | |
| T003 | 1 | Establish theme/design system | Light/dark/system themes and centralized UI tokens work | COMPLETED | Extended `Colors` to full semantic OTT palette (30+ tokens per scheme); added `Typography` (13 named presets); added `Radius` (7 levels); added `Elevation` (5 shadow presets); added `Motion` (timing + spring configs); renamed Spacing to semantic names with legacy aliases; `useTheme()` now returns full design system; `ThemedText` supports `variant` prop with legacy `type` compat; `ThemedView` simplified; `ThemeToggleWrapper` uses tokens | `tsc --noEmit` ✓, `expo lint` ✓, `git diff --check` ✓ | Preserve legacy Spacing aliases and `type` prop for starter UI backward compat; will remove when starter screens are replaced | See Git history | |
| T004 | 1 | React Native Reusables / reusable UI foundation | Common OTT UI components are reusable and consistent | COMPLETED | Created `Button` (6 variants, scale animation), `Badge` (6 variants), `Card`+`PressableCard` (4 variants + sub-sections), `Input` (focus ring, label, error, adornments), `Separator`, `Skeleton`+`SkeletonRow` (Reanimated pulse), `SectionHeader` (OTT pattern), `LoadingView`/`EmptyView`/`ErrorView`/`OfflineView` (explicit async states); barrel index at `src/components/ui/index.ts`; all use `useTheme()` tokens, no NativeWind | `tsc --noEmit` ✓, `expo lint` ✓, `git diff --check` ✓ | NativeWind dropped — conflicts with our token-based design system; RNR pattern adopted as copy-paste/own-the-code without the CLI dependency | See Git history | |
| T005 | 1 | Establish quality tooling | Strict TS, ESLint, Prettier and tests work | COMPLETED | Installed `@testing-library/react-native`, added `jest.config.js` with RNTL built-in matchers, created manual mocks for `expo-router`/`react-native-reanimated`/`expo-splash-screen`, added `.prettierrc`, added 43 tests across 3 suites | `npm test` ✓, `npm run format:check` ✓ | RNTL v13 built-in matchers used instead of deprecated jest-native. Manual Reanimated mock prevents native-module crashes in Jest. | See Git history | |
| T006 | 2 | Establish SQLite foundation | Versioned database and migrations work | COMPLETED | Created `src/data/db/schema.ts` with explicit tables for settings, favorites, recently_watched, playlists, and playlist_items. Added SQLiteProvider to AppProviders. | `npm run test` ✓ | SQLite is cache-first local priority for user data. DB initialization happens during app splash screen via useSuspense and expo-sqlite | See Git history | |
| T007 | 2 | Establish local repositories | Persistent data uses repository boundaries | COMPLETED | Created repository implementations for favorites, playlists, recently_watched, and settings in `src/data/repositories/sqlite-*.ts`. Replaced Zustand's AsyncStorage with SQLite in `src/stores/theme.ts`. | `npm run test` ✓ | Using `openDatabaseSync` enables synchronous global database access inside Zustand stores outside of the React context | See Git history | |
| T008 | 3 | Integrate iptv-org SDK | IPTV data is accessible through a provider abstraction | COMPLETED | Created `src/data/providers/iptv-org/index.ts` using raw fetch to circumvent Node-only dependencies in the SDK. | `npx tsc --noEmit` ✓ | Using direct fetch with SDK types instead of `DataManager` to avoid `fs-extra` crash in React Native | See Git history | |
| T009 | 3 | Establish domain data mapping | UI is independent of raw provider models | COMPLETED | Implemented `mapChannel`, `mapStream`, `mapCategory`, etc., to convert SDK `Types` to `domain.ts` interfaces. | `npx tsc --noEmit` ✓ | Domain types are cleanly separated from the iptv-org payload format | See Git history | |
| T010 | 3 | Establish TanStack Query layer | Cache-first loading and background refresh work | COMPLETED | Created `src/data/queries/iptv.ts` with standard hooks like `useChannels`, `useStreams`, etc. | `npx tsc --noEmit` ✓ | Used sensible `staleTime`s (1hr to 24hr) since this catalog data changes infrequently | See Git history | |
| T011 | 4 | Build Home screen | OTT-style reusable home sections work | COMPLETED | Created `src/app/index.tsx` with `HorizontalList` and `ChannelCard` showing categorized query results | `npx tsc --noEmit` ✓, tests ✓ | Replaced starter home screen | See Git history | |
| T012 | 4 | Build channel browsing | Efficient channel browsing works | COMPLETED | Converted `explore.tsx` to `channels.tsx` with a virtualized `FlatList` | `npx tsc --noEmit` ✓ | Included `initialNumToRender` and windowing for large catalogs | See Git history | |
| T013 | 4 | Build channel filters | Country, language and category filters work | COMPLETED | Implemented `FilterRow` and added category/country chips to `channels.tsx` | `npx tsc --noEmit` ✓ | Horizontal scroll chips chosen over modals for quick one-tap filtering | See Git history | |
| T014 | 4 | Build global search | Multi-scope search works | COMPLETED | Added `Input` search bar at the top of the `channels.tsx` catalog | `npx tsc --noEmit` ✓ | Simple client-side text filter over TanStack Query cache | See Git history | |
| T015 | 5 | Implement favorites | Favorites persist locally | COMPLETED | Added SQLite hook and favorite toggle on ChannelCard | `npx tsc --noEmit` ✓ | Favorites hydrate channel objects via query client | See Git history | |
| T016 | 5 | Implement recently watched | Latest 20 channels persist correctly | COMPLETED | Added hook, rendered history horizontally on Library screen | `npx tsc --noEmit` ✓ | Recently watched hydrates the same way as favorites | See Git history | |
| T017 | 5 | Implement playlists | Users can create playlists, add/remove channels, preview membership, and browse playlist contents | COMPLETED | Added playlist creation, channel-card add/remove picker, membership counts, and draggable playlist details with three channel avatars plus `+N` and a removable channel list | `npx tsc --noEmit` ✓, `npx expo lint` ✓, Jest ✓, Prettier ✓ | SQLite remains the persistence owner; playlist-to-player launch is part of T026 | See Git history | |
| T018 | 6 | Establish EPG data layer | EPG data is mapped independently of UI | COMPLETED | Added `getGuide` to `IptvOrgProvider` with a deterministic mock EPG generator, mapped to `domain.ts` `GuideEntry` | `npx tsc --noEmit` ✓ | iptv-org EPG data is XMLTV which is too expensive for client-side RN parsing. Mocked deterministically to prove the data layer architecture | See Git history | |
| T019 | 6 | Build TV Guide | Channel guide is opened on demand from its card with past/current/future schedules | COMPLETED | Removed the Guide tab; added a draggable channel-card guide sheet with next-24-hours, past-3-days, and next-7-days filters and a live-program badge | `npx tsc --noEmit` ✓, `npx expo lint` ✓, Jest ✓, Prettier ✓ | Guide stays contextual to a channel; mock EPG spans the selected windows | See Git history | |
| T020 | 7 | Establish player architecture | Player responsibilities are isolated and reusable | COMPLETED | Added player-session hook, source adapter, dynamic route, and reusable video-player component | `npx tsc --noEmit` ✓, `npx expo lint` ✓ | Expo Video lifecycle lives in a feature hook; route resolves the channel and renders the player | See Git history | |
| T021 | 7 | Implement video playback | expo-video playback and controls work | COMPLETED | Added stream loading, playback controls, and a seek timeline | `npx tsc --noEmit` ✓, Jest ✓ | Stream headers pass through; HLS URLs are identified as HLS sources | See Git history | |
| T022 | 7 | Implement stream fallback | Alternate streams are attempted after failure | COMPLETED | Automatically tries alternate streams on player errors; supports manual alternate selection and retry | Jest ✓ | Automatic failover stops while offline; retry restarts the stream sequence | See Git history | |
| T023 | 7 | Implement player error states | Offline/unstable/unavailable states are clear | COMPLETED | Added offline, stream-loading failure, no-stream, and player-error states with retry | Jest ✓ | Network state comes from NetInfo; provider and player failures remain distinct | See Git history | |
| T024 | 7 | Implement player gestures | Double tap and swipe gestures work correctly | COMPLETED | Added double-tap seeking and horizontal seek/vertical volume gestures with feedback | `npx expo lint` ✓, Jest ✓ | Gesture thresholds and action mapping are unit-tested | See Git history | |
| T025 | 7 | Implement fullscreen/orientation | Fullscreen transitions work reliably | COMPLETED | Added VideoView fullscreen controls and landscape lock with portrait restoration | `npx tsc --noEmit` ✓ | Tabs and normal player remain portrait; fullscreen opts into landscape | See Git history | |
| T026 | 8 | Integrate end-to-end flows | Browse → channel → player → history/favorites works | TODO | | | | | |
| T027 | 8 | Accessibility/UX pass | Core UI is accessible and consistent | TODO | | | | | |
| T028 | 8 | Performance pass | Large IPTV datasets and images remain responsive | TODO | | | | | |
| T029 | 8 | Automated test pass | Critical logic is covered | TODO | | | | | |
| T030 | 8 | Android/iOS validation | Core flows work on both platforms | TODO | | | | | |
| T031 | 8 | Final documentation checkpoint | Project documentation matches implementation | TODO | | | | | Final pass after feature work |
| T032 | 0 | Organize project instructions and documentation | AI contract, guide, state snapshot, and task queue have clear canonical locations | COMPLETED | Consolidated AI contract in AGENTS.md; grouped guide/state/tracker under docs | `git diff --check` passed; checked internal Markdown links | Root AGENTS; docs/README; docs/project/* | See Git history | |

## Error and Issue Log

| ID | Task | Type | Error / Issue | Cause | Resolution | Status |
|---|---|---|---|---|---|---|
| E001 | | | | | | |

## Architecture Decision Log

| ID | Date | Decision | Reason | Alternatives | Impact |
|---|---|---|---|---|---|
| D001 | 2026-09-27 | Keep a single root `AGENTS.md` as the AI operating contract; keep product guide and progress records under `docs/` | Avoid duplicate instructions and scattered project records while retaining Antigravity-specific rule/workflow/skill discovery | Keep a separate root INSTRUCTIONS.md and state/task files | AI workflow stays at root; human/project tracking docs are grouped under docs |

## Current Checkpoint

- **Current Phase:** 8 — End-to-End Integration and Validation.
- **Current Task:** T026
- **Last Completed Tasks:** T020, T021, T022, T023, T024, T025
- **Last Commit:** See Git history.
- **Next Task:** T026 — Integrate end-to-end flows.
- **Known Issues:** `npx expo-doctor` reports the existing `@types/jest` 30.0.0 differs from SDK 57's expected 29.5.14; TypeScript, lint, and Jest pass.
- **Next Expected Outcome:** Browse → channel → player → history/favorites flows are connected.

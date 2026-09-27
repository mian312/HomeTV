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
| T006 | 2 | Establish SQLite foundation | Versioned database and migrations work | TODO | | | | | |
| T007 | 2 | Establish local repositories | Persistent data uses repository boundaries | TODO | | | | | |
| T008 | 3 | Integrate iptv-org SDK | IPTV data is accessible through a provider abstraction | TODO | | | | | |
| T009 | 3 | Establish domain data mapping | UI is independent of raw provider models | TODO | | | | | |
| T010 | 3 | Establish TanStack Query layer | Cache-first loading and background refresh work | TODO | | | | | |
| T011 | 4 | Build Home screen | OTT-style reusable home sections work | TODO | | | | | |
| T012 | 4 | Build channel browsing | Efficient channel browsing works | TODO | | | | | |
| T013 | 4 | Build channel filters | Country, language and category filters work | TODO | | | | | |
| T014 | 4 | Build global search | Multi-scope search works | TODO | | | | | |
| T015 | 5 | Implement favorites | Favorites persist locally | TODO | | | | | |
| T016 | 5 | Implement recently watched | Latest 20 channels persist correctly | TODO | | | | | |
| T017 | 5 | Implement playlists | Custom playlists persist and can be managed | TODO | | | | | |
| T018 | 6 | Establish EPG data layer | EPG data is mapped independently of UI | TODO | | | | | |
| T019 | 6 | Build TV Guide | Current/upcoming programs are usable | TODO | | | | | |
| T020 | 7 | Establish player architecture | Player responsibilities are isolated and reusable | TODO | | | | | |
| T021 | 7 | Implement video playback | expo-video playback and controls work | TODO | | | | | |
| T022 | 7 | Implement stream fallback | Alternate streams are attempted after failure | TODO | | | | | |
| T023 | 7 | Implement player error states | Offline/unstable/unavailable states are clear | TODO | | | | | |
| T024 | 7 | Implement player gestures | Double tap and swipe gestures work correctly | TODO | | | | | |
| T025 | 7 | Implement fullscreen/orientation | Fullscreen transitions work reliably | TODO | | | | | |
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

- **Current Phase:** 2 — data foundation and sqlite start.
- **Current Task:** T006
- **Last Completed Tasks:** T005
- **Last Commit:** See Git history.
- **Next Task:** T006 — Establish SQLite foundation (Versioned database and migrations work).
- **Known Issues:** Starter UI remains; AsyncStorage theme persistence (migration deferred to T007).
- **Next Expected Outcome:** SQLite schema and migrations set up for favorites/recently watched/settings.

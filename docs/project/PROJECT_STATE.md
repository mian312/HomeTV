# HomeTV — Current Project State

This is a verified implementation snapshot. `tasks.md` is the task/history record; `../README.md` is the product and architecture guide.

## Overview

- Product: HomeTV, a free mobile-first OTT/IPTV app for Android and iOS.
- Initial catalog source: iptv-org via `@iptv-org/sdk`.
- Current project: Expo Router starter at the repository root; HomeTV feature implementation is not complete.
- Expo SDK: `~57.0.25`.
- React Native: `0.86.3`; React `19.2.3`; TypeScript `~6.0.3`.
- TypeScript strict mode: enabled.

## Current milestone and next task

- Phase: 0 — workspace baseline/organization, with implementation foundation next.
- Last completed task: T001 workspace and dependency inspection, plus T032 documentation organization.
- Next planned task: T002 establish project architecture.
- Commit details for the documentation organization are recorded in Git history.

## Implemented baseline

- Expo Router is configured and route files exist under `src/app/` (`_layout.tsx`, `index.tsx`, `explore.tsx`).
- The Expo starter UI is still present; the Home route is not yet the HomeTV OTT screen.
- A basic light/dark theme and spacing constants exist in `src/constants/theme.ts`.
- Theme mode is managed with Zustand in `src/store/theme.ts` and currently persisted using AsyncStorage. This is temporary legacy behavior to migrate to SQLite settings before removing AsyncStorage.
- Installed dependencies include the Expo/native packages, `@iptv-org/sdk`, TanStack Query, Zustand, Jest, and `jest-expo` listed in the root `package.json`.
- `tsconfig.json` enables `strict: true`.
- `.agents/rules/hometv-architecture.md`, `.agents/workflows/hometv-phase.md`, and `.agents/skills/hometv-expo-engineering/SKILL.md` provide workspace-specific AI guidance.

## Not implemented yet

- HomeTV-specific query client/provider and IPTV repository/provider/model mapping.
- SQLite database client, schema/migrations, and repositories.
- HomeTV domain types and feature-layer behavior.
- Home/channel/search/favorites/history/playlist/EPG screens and business logic.
- Isolated video player, fallback, and player error UX.
- Full theme tokens (typography, radii, elevation, motion) and consistent token-based components.
- Jest configuration, test files, and `@testing-library/react-native` setup.
- Full accessibility/performance/device validation.

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

## Known issues and limitations

- The starter home screen remains.
- AsyncStorage currently persists theme state and should be migrated as part of local settings work.
- Theme tokens are incomplete.
- Tests have no current test files/configuration. Add testing-library/config in the testing foundation task.
- IPTV streams may be unavailable or unsuitable for a given device or jurisdiction; availability is dynamic.

## Recovery checklist

Before continuing: read `AGENTS.md`, this file, `tasks.md`, run `git status` and inspect recent `git log`, then review relevant source. Source code and current package manifests are authoritative if this snapshot becomes stale.

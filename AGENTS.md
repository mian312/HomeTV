This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## HomeTV AI development workflow

This file is the single root operating contract for AI coding agents. Do not create a second root-level instruction file. Antigravity-specific architecture rules, workflow, and skill remain under `.agents/`.

### Before each task

1. Read `docs/project/PROJECT_STATE.md` and `docs/project/tasks.md`.
2. Inspect `git status` and recent `git log` before editing.
3. Read relevant source/configuration; source code is authoritative if documentation is stale.
4. Correct stale tracking docs when discovered. Never describe planned behavior as implemented.

### Scope and continuation

- Implement only the requested task and necessary supporting changes.
- If asked to continue with the next task, select the next appropriate unfinished task in `docs/project/tasks.md`, mark it `IN_PROGRESS`, implement only that task, validate it, then update the task tracker and state snapshot.
- Do not repeat completed work, begin unrelated future work, or ask the user to repeat context already recorded unless a real product decision is missing.
- After meaningful completed work, leave a recoverable checkpoint in the tracker and state snapshot.

### Design and architecture

- Reuse existing components and tokens; extend them when appropriate. Avoid duplicate components and arbitrary design values.
- Keep responsibilities separated: UI → feature hooks → application/domain logic → repositories → providers/SQLite.
- TanStack Query owns remote/server state, Zustand owns transient client/UI state, and SQLite owns durable local data.
- Do not put provider SDK calls, SQL, or substantial business logic directly in route screens.
- Keep scope aligned with `docs/README.md`; defer M3U/Xtream, backends/auth, ads, analytics, premium features, and error monitoring unless explicitly requested.

### Completion, Git, and documentation

- Run appropriate TypeScript, lint, and relevant tests; perform runtime/build validation only when appropriate and requested. Record blockers/issues in the task and state documents.
- Before committing, inspect `git status` and run `git diff --check`. Use a meaningful conventional commit (`docs:`, `feat:`, `fix:`, `test:`, `chore:`, etc.). Never commit secrets or unnecessary generated artifacts; never discard user changes with destructive resets.
- `docs/project/tasks.md` is the task/history record. `docs/project/PROJECT_STATE.md` is the verified current implementation snapshot. `docs/README.md` is the product and architecture guide.
- Update the state snapshot when implementation, architecture, navigation, providers, persistence, features, limitations, or current work changes. Keep the next task/checkpoint accurate.

The next session must be able to continue using this file, the two project tracking documents, Git history, and source code without relying on conversation memory.

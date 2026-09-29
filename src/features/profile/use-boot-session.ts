/**
 * useBootSession — resolves the session phase on application start.
 *
 * Runs once after SQLite has initialised (inside AppProviders / Suspense
 * boundary). Reads the persisted last-active profile ID, loads the profile,
 * then transitions the session store out of 'booting' into the correct phase:
 *
 *   - 'needs-profile'  → no profiles exist at all.
 *   - 'locked'         → last active profile has a PIN.
 *   - 'ready'          → last active profile is unlocked.
 *
 * If the last-active profile no longer exists (e.g., it was deleted while
 * another device synced) the hook falls back to the most recent profile,
 * or to 'needs-profile' if there are none.
 */

import { useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { SqliteProfileRepository } from '@/data/repositories/sqlite-profile';
import { useSessionStore } from '@/stores/session';
import type { BootResult } from '@/stores/session';

export function useBootSession(): void {
  const db = useSQLiteContext();
  const boot = useSessionStore((s) => s.boot);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    void (async () => {
      const repo = new SqliteProfileRepository(db);

      // Resolve which profile to activate.
      const lastActiveId = await repo.loadLastActiveId();
      let profile = lastActiveId ? await repo.getById(lastActiveId) : null;

      // Fallback: use the first profile alphabetically if the stored ID is gone.
      if (!profile) {
        const all = await repo.getAll();
        profile = all.length > 0 ? (all[0] ?? null) : null;
      }

      let result: BootResult;
      if (!profile) {
        result = { status: 'needs-profile' };
      } else if (profile.pinEnabled) {
        result = { status: 'locked', profile };
      } else {
        result = { status: 'ready', profile };
      }

      boot(result);

      // Persist the resolved last-active ID for the next launch.
      if (profile) {
        await repo.saveLastActiveId(profile.id);
      }
    })();
  }, [db, boot]);
}

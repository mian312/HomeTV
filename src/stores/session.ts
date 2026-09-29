/**
 * Profile session store — Zustand (transient application state).
 *
 * Models the boot lifecycle and active-profile state as an explicit state
 * machine. Screens and navigation gates read from this store; they never
 * query SQLite for profile information directly.
 *
 * State machine:
 *
 *   booting ──► needs-profile  (no profiles exist — go to profile creation)
 *           └──► locked        (active profile has a PIN — go to unlock screen)
 *           └──► ready         (active profile is loaded and unlocked)
 *
 * The session store owns:
 *   - The boot phase.
 *   - The active profile snapshot (updated when the profile is mutated).
 *   - Profile switching / lock / unlock actions (UI-facing).
 *
 * Persistence is handled by ProfileRepository:
 *   - Last-active profile ID is persisted in the SQLite settings table.
 *   - PIN verifier lives in expo-secure-store (not here).
 *   - All other profile data lives in SQLite.
 */

import { create } from 'zustand';

import type { Profile, ProfileId } from '@/types/domain';

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

export type SessionPhase = 'booting' | 'needs-profile' | 'onboarding' | 'locked' | 'ready';

export interface SessionState {
  /** Current boot/auth phase. */
  phase: SessionPhase;

  /** The active profile when phase is 'locked', 'onboarding', or 'ready'. Null otherwise. */
  activeProfile: Profile | null;

  /**
   * When phase is 'locked', this is the profile that is waiting for PIN entry.
   * Same as activeProfile during lock flow.
   */
  lockedProfileId: ProfileId | null;

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Called once by the root layout after SQLite initialises and the last
   * active profile has been resolved.
   */
  boot(result: BootResult): void;

  /**
   * Switch to a different profile.
   * If the profile has a PIN, transitions to 'locked'; otherwise to 'ready'.
   */
  switchProfile(profile: Profile): void;

  /**
   * Called after successful PIN verification — transitions from 'locked' to 'ready'.
   */
  unlock(profile: Profile): void;

  /**
   * Lock the current profile (return to 'locked' state).
   * Does nothing if the active profile has no PIN (transitions to 'needs-profile'
   * or 'ready' would be wrong here — the caller should use switchProfile instead).
   */
  lock(): void;

  /**
   * Leave the current profile and return to the profile selector.
   * Clears the active profile without deleting it.
   */
  leaveProfile(): void;

  /**
   * Update the stored active profile snapshot after a mutation (name/avatar change).
   */
  refreshActiveProfile(profile: Profile): void;
}

// ---------------------------------------------------------------------------
// Boot result — produced by the root layout's boot logic
// ---------------------------------------------------------------------------

export type BootResult =
  | { status: 'needs-profile' }
  | { status: 'locked'; profile: Profile }
  | { status: 'onboarding'; profile: Profile }
  | { status: 'ready'; profile: Profile };

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionState>((set, get) => ({
  phase: 'booting',
  activeProfile: null,
  lockedProfileId: null,

  boot(result) {
    switch (result.status) {
      case 'needs-profile':
        set({ phase: 'needs-profile', activeProfile: null, lockedProfileId: null });
        break;
      case 'locked':
        set({
          phase: 'locked',
          activeProfile: result.profile,
          lockedProfileId: result.profile.id,
        });
        break;
      case 'onboarding':
        set({ phase: 'onboarding', activeProfile: result.profile, lockedProfileId: null });
        break;
      case 'ready':
        set({ phase: 'ready', activeProfile: result.profile, lockedProfileId: null });
        break;
    }
  },

  switchProfile(profile) {
    if (profile.pinEnabled) {
      set({ phase: 'locked', activeProfile: profile, lockedProfileId: profile.id });
    } else if (!profile.onboardingCompleted) {
      set({ phase: 'onboarding', activeProfile: profile, lockedProfileId: null });
    } else {
      set({ phase: 'ready', activeProfile: profile, lockedProfileId: null });
    }
  },

  unlock(profile) {
    if (!profile.onboardingCompleted) {
      set({ phase: 'onboarding', activeProfile: profile, lockedProfileId: null });
    } else {
      set({ phase: 'ready', activeProfile: profile, lockedProfileId: null });
    }
  },

  lock() {
    const { activeProfile } = get();
    if (activeProfile?.pinEnabled) {
      set({ phase: 'locked', lockedProfileId: activeProfile.id });
    }
    // If no PIN on the active profile, lock is a no-op — caller should not invoke this.
  },

  leaveProfile() {
    set({ phase: 'needs-profile', activeProfile: null, lockedProfileId: null });
  },

  refreshActiveProfile(profile) {
    set({ activeProfile: profile });
  },
}));

/**
 * Profile PIN model and authenticator interface (T038).
 *
 * Defines the PIN policy, domain types, and the `ProfileAuthenticator`
 * interface. No actual verifier derivation or storage happens here —
 * those belong to the concrete implementation in T039 (expo-secure-store).
 *
 * Design intent (ADR D006):
 *  - The interface decouples screens from the verifier store so that device
 *    biometric authentication can be added later without changing call sites.
 *  - The concrete implementation lives in `SecureStoreAuthenticator`.
 *  - `pin_enabled` metadata is written to SQLite via `ProfileRepository`.
 *  - The actual verifier bytes live only in expo-secure-store.
 */

import type { ProfileId } from '@/types/domain';

// ---------------------------------------------------------------------------
// PIN policy constants
// ---------------------------------------------------------------------------

/** Exact PIN length required (4 digits, like most OTT/streaming PIN dialogs). */
export const PIN_LENGTH = 4;

/**
 * Maximum consecutive unlock attempts before the profile is temporarily locked.
 * The lock duration is `LOCKOUT_DURATION_MS`.
 */
export const MAX_UNLOCK_ATTEMPTS = 5;

/**
 * Duration (ms) to lock a profile after MAX_UNLOCK_ATTEMPTS failures.
 * 30 seconds — short enough to not be catastrophic, long enough to rate-limit
 * offline brute-force from the UI.
 */
export const LOCKOUT_DURATION_MS = 30_000;

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/**
 * Result of a PIN verification attempt.
 *
 * - `success`         — PIN matched the stored verifier.
 * - `invalid`         — PIN did not match.
 * - `rate-limited`    — too many consecutive failures; unlock is temporarily blocked.
 * - `not-configured`  — the profile has no PIN (pin_enabled = false in SQLite)
 *                        or the verifier is missing from secure storage (e.g. after
 *                        an iOS reinstall). Callers must handle this as a recovery path
 *                        rather than as a permanent error.
 */
export type PinVerifyResult =
  | { status: 'success' }
  | { status: 'invalid'; remainingAttempts: number }
  | { status: 'rate-limited'; retryAfterMs: number }
  | { status: 'not-configured' };

/**
 * Result of a PIN set or change operation.
 *
 * - `success`         — verifier written successfully.
 * - `invalid-current` — the current PIN provided did not match (change flow).
 * - `error`           — unexpected storage error.
 */
export type PinSetResult =
  | { status: 'success' }
  | { status: 'invalid-current' }
  | { status: 'error'; message: string };

/**
 * Validation result for a raw PIN string before submitting it.
 * The UI uses this to drive inline feedback before making a storage call.
 */
export type PinValidationResult =
  | { valid: true }
  | { valid: false; reason: 'too-short' | 'not-digits' };

// ---------------------------------------------------------------------------
// Helper: validate a raw PIN string
// ---------------------------------------------------------------------------

/**
 * Validates a PIN string before it is passed to the authenticator.
 *
 * Pure function — no side effects, fully unit-testable.
 */
export function validatePin(pin: string): PinValidationResult {
  if (!/^\d+$/.test(pin)) {
    return { valid: false, reason: 'not-digits' };
  }
  if (pin.length < PIN_LENGTH) {
    return { valid: false, reason: 'too-short' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// ProfileAuthenticator interface
// ---------------------------------------------------------------------------

/**
 * Abstract authenticator for profile PIN operations.
 *
 * Screens and feature hooks depend on this interface, not on any concrete
 * secure-storage implementation. This allows:
 *   - Swapping expo-secure-store for device biometrics in a later SDK.
 *   - Full unit-testing with a mock implementation.
 *
 * Implementations must:
 *   - Never write plaintext PINs to any persistent store.
 *   - Use rate-limiting to mitigate online brute-force from the UI.
 *   - Handle the missing-verifier recovery case explicitly (ADR D006).
 */
export interface ProfileAuthenticator {
  /**
   * Verify a PIN for a profile.
   *
   * @param profileId - The profile whose PIN is being verified.
   * @param pin       - The raw PIN string entered by the user.
   */
  verify(profileId: ProfileId, pin: string): Promise<PinVerifyResult>;

  /**
   * Set a PIN for a profile that does not yet have one.
   *
   * Callers must also call `profileRepository.setPinEnabled(profileId, true)`
   * after a successful result to keep SQLite metadata in sync.
   *
   * @param profileId - The profile to configure.
   * @param pin       - The new PIN (pre-validated via `validatePin`).
   */
  set(profileId: ProfileId, pin: string): Promise<PinSetResult>;

  /**
   * Change the PIN for a profile that already has one.
   *
   * Requires the current PIN to prevent an attacker who has brief physical
   * access from silently changing the PIN.
   *
   * @param profileId  - The profile to update.
   * @param currentPin - The existing PIN (verified before the change).
   * @param newPin     - The replacement PIN.
   */
  change(profileId: ProfileId, currentPin: string, newPin: string): Promise<PinSetResult>;

  /**
   * Remove the PIN from a profile.
   *
   * Requires the current PIN. Callers must also call
   * `profileRepository.setPinEnabled(profileId, false)` after success.
   *
   * @param profileId  - The profile to update.
   * @param currentPin - The current PIN (verified before removal).
   */
  remove(profileId: ProfileId, currentPin: string): Promise<PinSetResult>;

  /**
   * Clear the PIN and verifier for a profile without verifying it.
   *
   * Only for recovery paths (e.g. verifier missing after iOS reinstall).
   * Should be called in conjunction with `profileRepository.setPinEnabled(false)`.
   */
  forceRemove(profileId: ProfileId): Promise<void>;

  /**
   * Reset the consecutive-failure counter for a profile.
   * Call this after a successful unlock so subsequent errors start fresh.
   */
  resetAttemptCounter(profileId: ProfileId): void;
}

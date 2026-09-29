/**
 * SecureStoreAuthenticator — concrete ProfileAuthenticator implementation (T039).
 *
 * PIN security model (ADR D006):
 *   - The raw PIN is NEVER stored anywhere.
 *   - A random 16-byte salt is generated per PIN set operation.
 *   - The verifier is iterated SHA-256(salt + pin, 1000 iterations).
 *     SDK 57 expo-crypto exposes `digestStringAsync` (SHA-256 only) with no
 *     built-in PBKDF2/Argon2, so we hand-roll iteration in JS. Documented
 *     limitation: a 4-digit PIN is brute-forceable if the verifier is extracted
 *     offline. The iteration count and UI-level rate limiting mitigate online attacks.
 *   - The salt + verifier are stored as JSON in expo-secure-store under a key
 *     derived from the profile ID.
 *   - SQLite stores only `pin_enabled` metadata (boolean). No verifier bytes
 *     ever reach SQLite.
 *
 * Rate limiting:
 *   - An in-memory attempt counter per profile (resets on process restart,
 *     which is acceptable — the limiter targets UI-level attacks).
 *   - After MAX_UNLOCK_ATTEMPTS failures the profile is locked for
 *     LOCKOUT_DURATION_MS before another attempt is allowed.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import type { ProfileId } from '@/types/domain';
import type { ProfileAuthenticator, PinSetResult, PinVerifyResult } from './pin-authenticator';
import { MAX_UNLOCK_ATTEMPTS, LOCKOUT_DURATION_MS, PIN_LENGTH } from './pin-authenticator';

// ---------------------------------------------------------------------------
// Key derivation helpers
// ---------------------------------------------------------------------------

/** Number of SHA-256 iterations to run over salt+pin. */
const ITERATIONS = 1000;

/** secure-store key for a profile's verifier record. */
function verifierKey(profileId: ProfileId): string {
  return `profile_pin_verifier_${profileId}`;
}

interface VerifierRecord {
  salt: string;   // hex-encoded 16-byte random salt
  hash: string;   // hex-encoded iterated SHA-256 output
}

/**
 * Derive a verifier from a raw PIN + hex salt using iterated SHA-256.
 *
 * Each iteration feeds the previous digest (as hex) back as input.
 * This is deliberately simple given the SDK constraint — documented limitation.
 */
async function deriveVerifier(pin: string, hexSalt: string): Promise<string> {
  let input = hexSalt + pin;
  for (let i = 0; i < ITERATIONS; i++) {
    input = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input,
      { encoding: Crypto.CryptoEncoding.HEX },
    );
  }
  return input;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Both strings must be the same length (both are fixed-length hex digests here).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Rate-limiting state (in-memory, resets on process restart)
// ---------------------------------------------------------------------------

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

// ---------------------------------------------------------------------------
// SecureStoreAuthenticator
// ---------------------------------------------------------------------------

export class SecureStoreAuthenticator implements ProfileAuthenticator {
  /** Per-profile attempt counters (keyed by profileId string). */
  private attempts = new Map<string, AttemptRecord>();

  private getRecord(profileId: ProfileId): AttemptRecord {
    return this.attempts.get(profileId) ?? { count: 0, lockedUntil: null };
  }

  private setRecord(profileId: ProfileId, record: AttemptRecord): void {
    this.attempts.set(profileId, record);
  }

  resetAttemptCounter(profileId: ProfileId): void {
    this.attempts.delete(profileId);
  }

  async verify(profileId: ProfileId, pin: string): Promise<PinVerifyResult> {
    // Check rate limit first.
    const record = this.getRecord(profileId);
    if (record.lockedUntil !== null) {
      const remaining = record.lockedUntil - Date.now();
      if (remaining > 0) {
        return { status: 'rate-limited', retryAfterMs: remaining };
      }
      // Lock expired — reset counter.
      this.setRecord(profileId, { count: 0, lockedUntil: null });
    }

    // Load verifier from secure storage.
    const stored = await SecureStore.getItemAsync(verifierKey(profileId));
    if (!stored) {
      return { status: 'not-configured' };
    }

    let verifierRecord: VerifierRecord;
    try {
      verifierRecord = JSON.parse(stored) as VerifierRecord;
    } catch {
      // Corrupted — treat as not-configured so the UI can offer recovery.
      return { status: 'not-configured' };
    }

    const candidate = await deriveVerifier(pin, verifierRecord.salt);
    const match = constantTimeEqual(candidate, verifierRecord.hash);

    if (match) {
      this.resetAttemptCounter(profileId);
      return { status: 'success' };
    }

    // Failure: increment counter.
    const newCount = (this.getRecord(profileId).count) + 1;
    if (newCount >= MAX_UNLOCK_ATTEMPTS) {
      this.setRecord(profileId, {
        count: newCount,
        lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
      });
      return { status: 'rate-limited', retryAfterMs: LOCKOUT_DURATION_MS };
    }

    this.setRecord(profileId, { count: newCount, lockedUntil: null });
    return { status: 'invalid', remainingAttempts: MAX_UNLOCK_ATTEMPTS - newCount };
  }

  async set(profileId: ProfileId, pin: string): Promise<PinSetResult> {
    if (pin.length !== PIN_LENGTH || !/^\d+$/.test(pin)) {
      return { status: 'error', message: 'Invalid PIN format' };
    }

    try {
      // Generate a random 16-byte salt as a hex string.
      const saltBytes = Crypto.getRandomValues(new Uint8Array(16));
      const hexSalt = Array.from(saltBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const hash = await deriveVerifier(pin, hexSalt);
      const record: VerifierRecord = { salt: hexSalt, hash };

      await SecureStore.setItemAsync(verifierKey(profileId), JSON.stringify(record));
      this.resetAttemptCounter(profileId);
      return { status: 'success' };
    } catch (err) {
      return { status: 'error', message: String(err) };
    }
  }

  async change(profileId: ProfileId, currentPin: string, newPin: string): Promise<PinSetResult> {
    const verifyResult = await this.verify(profileId, currentPin);
    if (verifyResult.status !== 'success') {
      if (verifyResult.status === 'invalid') {
        return { status: 'invalid-current' };
      }
      if (verifyResult.status === 'rate-limited') {
        return { status: 'error', message: 'Too many attempts. Please wait.' };
      }
      return { status: 'invalid-current' };
    }
    return this.set(profileId, newPin);
  }

  async remove(profileId: ProfileId, currentPin: string): Promise<PinSetResult> {
    const verifyResult = await this.verify(profileId, currentPin);
    if (verifyResult.status !== 'success') {
      if (verifyResult.status === 'invalid') {
        return { status: 'invalid-current' };
      }
      if (verifyResult.status === 'rate-limited') {
        return { status: 'error', message: 'Too many attempts. Please wait.' };
      }
      return { status: 'invalid-current' };
    }

    try {
      await SecureStore.deleteItemAsync(verifierKey(profileId));
      this.resetAttemptCounter(profileId);
      return { status: 'success' };
    } catch (err) {
      return { status: 'error', message: String(err) };
    }
  }

  async forceRemove(profileId: ProfileId): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(verifierKey(profileId));
    } catch {
      // Silently ignore — the item may already be gone.
    }
    this.resetAttemptCounter(profileId);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * Application-wide authenticator singleton.
 *
 * Screens import this directly. The interface dependency means tests can
 * substitute a mock without touching the singleton.
 */
export const profileAuthenticator: ProfileAuthenticator = new SecureStoreAuthenticator();

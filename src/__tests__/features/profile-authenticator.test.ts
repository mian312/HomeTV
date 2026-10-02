import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

import { SecureStoreAuthenticator } from '@/features/profile/secure-store-authenticator';
import { MAX_UNLOCK_ATTEMPTS, LOCKOUT_DURATION_MS, PIN_LENGTH } from '@/features/profile/pin-authenticator';
import type { ProfileId } from '@/types/domain';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = i; 
    return arr;
  }),
  digestStringAsync: jest.fn(async (algo, data) => data + '-hashed'),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { HEX: 'HEX' },
}));

const mockSecureStore = jest.mocked(SecureStore);
const mockCrypto = jest.mocked(Crypto);

describe('SecureStoreAuthenticator', () => {
  let authenticator: SecureStoreAuthenticator;
  const profileId = 'test-profile-id' as ProfileId;

  beforeEach(() => {
    jest.clearAllMocks();
    authenticator = new SecureStoreAuthenticator();
  });

  describe('set PIN', () => {
    it('rejects invalid PIN formats', async () => {
      expect(await authenticator.set(profileId, '123')).toEqual({ status: 'error', message: 'Invalid PIN format' });
      expect(await authenticator.set(profileId, '123a')).toEqual({ status: 'error', message: 'Invalid PIN format' });
    });

    it('derives verifier and stores it', async () => {
      mockCrypto.digestStringAsync.mockImplementation(async (algo, data) => data + '-hashed');
      
      const result = await authenticator.set(profileId, '1234');
      
      expect(result).toEqual({ status: 'success' });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(1);
      
      const callArgs = mockSecureStore.setItemAsync.mock.calls[0];
      expect(callArgs[0]).toBe(`profile_pin_verifier_${profileId}`);
      
      const record = JSON.parse(callArgs[1]);
      expect(record.salt).toBeDefined();
      expect(record.hash).toBeDefined();
      // Should have called digest 1000 times
      expect(mockCrypto.digestStringAsync).toHaveBeenCalledTimes(1000);
    });
  });

  describe('verify PIN', () => {
    it('returns not-configured if no verifier exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
      
      const result = await authenticator.verify(profileId, '1234');
      
      expect(result).toEqual({ status: 'not-configured' });
    });

    it('returns not-configured if verifier is corrupted', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce('invalid json');
      
      const result = await authenticator.verify(profileId, '1234');
      
      expect(result).toEqual({ status: 'not-configured' });
    });

    it('returns success on valid PIN and resets rate limit', async () => {
      // Setup a valid stored record
      const salt = '00010203'; // Based on mocked random values
      let expectedHash = salt + '1234';
      for (let i = 0; i < 1000; i++) expectedHash += '-hashed';
      
      mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
        salt,
        hash: expectedHash
      }));
      mockCrypto.digestStringAsync.mockImplementation(async (algo, data) => data + '-hashed');

      const result = await authenticator.verify(profileId, '1234');
      
      expect(result).toEqual({ status: 'success' });
    });

    it('returns invalid on incorrect PIN and rate limits', async () => {
      const salt = '00010203'; 
      let correctHash = salt + '1234';
      for (let i = 0; i < 1000; i++) correctHash += '-hashed';
      
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify({
        salt,
        hash: correctHash
      }));
      mockCrypto.digestStringAsync.mockImplementation(async (algo, data) => data + '-hashed');

      // Attempts up to max
      let result;
      for (let i = 1; i < MAX_UNLOCK_ATTEMPTS; i++) {
        result = await authenticator.verify(profileId, '9999');
        expect(result).toEqual({ status: 'invalid', remainingAttempts: MAX_UNLOCK_ATTEMPTS - i });
      }

      // Final Attempt that triggers lockout
      result = await authenticator.verify(profileId, '9999');
      expect(result.status).toBe('rate-limited');
      
      // Subsequent attempt should be rate limited immediately without checking DB
      mockSecureStore.getItemAsync.mockClear();
      result = await authenticator.verify(profileId, '9999');
      expect(result.status).toBe('rate-limited');
      expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('change and remove PIN', () => {
    it('removes PIN after verifying current PIN', async () => {
      const salt = '00010203'; 
      let expectedHash = salt + '1234';
      for (let i = 0; i < 1000; i++) expectedHash += '-hashed';
      
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify({
        salt,
        hash: expectedHash
      }));

      const result = await authenticator.remove(profileId, '1234');
      
      expect(result).toEqual({ status: 'success' });
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(`profile_pin_verifier_${profileId}`);
    });

    it('force removes PIN without verification', async () => {
      await authenticator.forceRemove(profileId);
      
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(`profile_pin_verifier_${profileId}`);
    });
  });
});

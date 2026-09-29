/**
 * Profile Unlock screen — PIN entry for locked profiles.
 * Full implementation in T040/T091. This stub renders a placeholder.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, PinKeypad } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { PIN_LENGTH } from '@/features/profile/pin-authenticator';
import { profileAuthenticator } from '@/features/profile/secure-store-authenticator';
import { profileRepository } from '@/data/repositories';

export default function ProfileUnlockScreen() {
  const { colors, spacing } = useTheme();
  const { activeProfile, leaveProfile, unlock } = useSessionStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAfterMs, setRetryAfterMs] = useState(0);

  // Countdown timer for rate-limiting
  useEffect(() => {
    if (retryAfterMs <= 0) return;
    const interval = setInterval(() => {
      setRetryAfterMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfterMs]);

  async function handleUnlock(enteredPin: string) {
    if (!activeProfile) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await profileAuthenticator.verify(activeProfile.id, enteredPin);
      
      switch (result.status) {
        case 'success':
          unlock(activeProfile);
          await profileRepository.saveLastActiveId(activeProfile.id);
          router.replace('/' as any);
          break;
        case 'invalid':
          setErrorMsg(`Incorrect PIN. ${result.remainingAttempts} attempts remaining.`);
          setPin('');
          break;
        case 'rate-limited':
          setRetryAfterMs(result.retryAfterMs);
          setErrorMsg(`Too many attempts. Try again in ${Math.ceil(result.retryAfterMs / 1000)}s.`);
          setPin('');
          break;
        case 'not-configured':
          // Recovery path (e.g., SecureStore was cleared outside the app)
          setErrorMsg('PIN configuration missing. Please reset this profile.');
          break;
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // Handle PIN entry completion
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !loading && retryAfterMs === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void handleUnlock(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function handleLeave() {
    leaveProfile();
    router.replace('/profile/select' as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <View style={styles.header}>
        <ThemedText variant="headlineLarge" style={styles.title}>
          {activeProfile ? `Welcome back, ${activeProfile.name}` : 'Unlock Profile'}
        </ThemedText>
        <ThemedText
          variant="body"
          themeColor={errorMsg ? 'error' : 'textSecondary'}
          style={styles.subtitle}
        >
          {retryAfterMs > 0
            ? `Too many attempts. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`
            : errorMsg || 'Enter your PIN to continue.'}
        </ThemedText>
      </View>

      <PinKeypad
        pin={pin}
        pinLength={PIN_LENGTH}
        onPinChange={setPin}
        disabled={loading || retryAfterMs > 0}
      />

      <Button variant="ghost" onPress={handleLeave} style={styles.button}>
        <ThemedText variant="body">Switch Profile</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center' },
  button: { marginTop: 48 },
});

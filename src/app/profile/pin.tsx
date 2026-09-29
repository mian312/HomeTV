import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { PinKeypad } from '@/components/ui/pin-keypad';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import { profileAuthenticator } from '@/features/profile/secure-store-authenticator';
import { PIN_LENGTH } from '@/features/profile/pin-authenticator';
import type { ProfileId } from '@/types/domain';

type PinAction = 'setup' | 'change' | 'remove';

export default function ProfilePinScreen() {
  const { colors, spacing } = useTheme();
  const { id, action } = useLocalSearchParams<{ id: string; action: PinAction }>();
  
  const { activeProfile, refreshActiveProfile } = useSessionStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isChange = action === 'change';
  const isRemove = action === 'remove';
  const isSetup = action === 'setup';

  async function updateActiveProfileIfMatch() {
    if (activeProfile?.id === id) {
      const updated = await profileRepository.getById(id as ProfileId);
      if (updated) refreshActiveProfile(updated);
    }
  }

  async function handleSetup() {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await profileAuthenticator.set(id as ProfileId, currentPin);
      if (result.status === 'success') {
        await profileRepository.setPinEnabled(id as ProfileId, true);
        await updateActiveProfileIfMatch();
        Alert.alert('Success', 'PIN has been set.');
        router.back();
      } else {
        setErrorMsg(result.status === 'error' ? result.message : 'Failed to set PIN.');
        setCurrentPin('');
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
      setCurrentPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await profileAuthenticator.remove(id as ProfileId, currentPin);
      if (result.status === 'success') {
        await profileRepository.setPinEnabled(id as ProfileId, false);
        await updateActiveProfileIfMatch();
        Alert.alert('Success', 'PIN has been removed.');
        router.back();
      } else if (result.status === 'invalid-current') {
        setErrorMsg('Incorrect PIN.');
        setCurrentPin('');
      } else {
        setErrorMsg(result.status === 'error' ? result.message : 'Failed to remove PIN.');
        setCurrentPin('');
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
      setCurrentPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleChange() {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await profileAuthenticator.change(id as ProfileId, currentPin, newPin);
      if (result.status === 'success') {
        // No metadata change needed, but let's refresh to be safe
        await updateActiveProfileIfMatch();
        Alert.alert('Success', 'PIN has been changed.');
        router.back();
      } else if (result.status === 'invalid-current') {
        setErrorMsg('Incorrect current PIN.');
        setCurrentPin('');
        setNewPin('');
        setStep(1);
      } else {
        setErrorMsg(result.status === 'error' ? result.message : 'Failed to change PIN.');
        setNewPin('');
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
      setNewPin('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step === 1) {
      if (currentPin.length === PIN_LENGTH) {
        if (isRemove) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          void handleRemove();
        } else if (isChange) {
           
          setStep(2);
        } else if (isSetup) {
           
          void handleSetup();
        }
      }
    } else if (step === 2) {
      if (newPin.length === PIN_LENGTH) {
         
        void handleChange();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPin, newPin]);



  let title = '';
  let activeValue = '';
  let activeSetter = setCurrentPin;

  if (isSetup) {
    title = 'Enter New PIN';
    activeValue = currentPin;
    activeSetter = setCurrentPin;
  } else if (isRemove) {
    title = 'Enter Current PIN to Remove';
    activeValue = currentPin;
    activeSetter = setCurrentPin;
  } else if (isChange) {
    if (step === 1) {
      title = 'Enter Current PIN';
      activeValue = currentPin;
      activeSetter = setCurrentPin;
    } else {
      title = 'Enter New PIN';
      activeValue = newPin;
      activeSetter = setNewPin;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <View style={styles.header}>
        <ThemedText variant="headlineLarge" style={styles.title}>
          {title}
        </ThemedText>
        
        {errorMsg ? (
          <ThemedText variant="body" themeColor="error" style={styles.error}>
            {errorMsg}
          </ThemedText>
        ) : (
          <ThemedText variant="body" style={styles.subtitle}>
            Enter your 4-digit PIN
          </ThemedText>
        )}
      </View>

      <View style={styles.keypadWrapper}>
        <PinKeypad 
          pin={activeValue} 
          pinLength={PIN_LENGTH}
          onPinChange={activeSetter} 
          disabled={loading} 
        />
      </View>

      <Button
        variant="ghost"
        onPress={() => router.back()}
        disabled={loading}
        style={styles.cancelButton}
      >
        <ThemedText variant="button">Cancel</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', opacity: 0.8 },
  error: { textAlign: 'center', fontWeight: 'bold' },
  keypadWrapper: { flex: 1, justifyContent: 'center' },
  cancelButton: { alignSelf: 'stretch', marginTop: 24, marginBottom: 40 },
});

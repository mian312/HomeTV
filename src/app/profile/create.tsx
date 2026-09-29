/**
 * Profile Create screen — name + optional avatar.
 * Full implementation in T046. This stub creates a profile and navigates home.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, Switch } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, Input } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { PIN_LENGTH } from '@/features/profile/pin-authenticator';
import { profileAuthenticator } from '@/features/profile/secure-store-authenticator';
import { profileRepository } from '@/data/repositories';
import { useSessionStore } from '@/stores/session';

export default function ProfileCreateScreen() {
  const { colors, spacing, radius } = useTheme();
  const boot = useSessionStore((s) => s.boot);
  
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a profile name.');
      return;
    }
    
    if (pinEnabled && pin.length !== PIN_LENGTH) {
      Alert.alert('Invalid PIN', `PIN must be exactly ${PIN_LENGTH} digits.`);
      return;
    }
    
    setLoading(true);
    try {
      const finalAvatarKey = avatarKey.trim() || null;
      const profile = await profileRepository.create({ 
        name: trimmedName,
        avatarKey: finalAvatarKey
      });
      
      if (pinEnabled) {
        const setResult = await profileAuthenticator.set(profile.id, pin);
        if (setResult.status !== 'success') {
          await profileRepository.delete(profile.id);
          Alert.alert('Error', 'Failed to set PIN. Profile creation aborted.');
          setLoading(false);
          return;
        }
        await profileRepository.setPinEnabled(profile.id, true);
      }
      
      // Navigate to onboarding flow
      router.replace(`/profile/onboarding?id=${profile.id}` as any);
    } catch (e) {
      console.error('Profile creation error:', e);
      Alert.alert('Error', `Could not create profile. ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
        <ThemedText variant="headlineLarge" style={styles.title}>
          New Profile
        </ThemedText>
        
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.border, borderRadius: radius.full }]}>
            <ThemedText variant="headlineLarge" style={styles.avatarText}>
              {avatarKey || name.charAt(0).toUpperCase() || '?'}
            </ThemedText>
          </View>
        </View>

        <Input
          label="Name"
          placeholder="Profile Name"
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={40}
          containerStyle={styles.input}
        />

        <Input
          label="Avatar Emoji (Optional)"
          placeholder="e.g. 🦊"
          value={avatarKey}
          onChangeText={setAvatarKey}
          maxLength={2}
          containerStyle={styles.input}
        />

        <View style={styles.switchRow}>
          <ThemedText variant="body">Require PIN to access</ThemedText>
          <Switch
            value={pinEnabled}
            onValueChange={setPinEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        {pinEnabled && (
          <Input
            label="PIN"
            placeholder={`${PIN_LENGTH}-digit PIN`}
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={PIN_LENGTH}
            containerStyle={styles.input}
          />
        )}

        <View style={[styles.actions, { marginTop: spacing.xl }]}>
          <Button
            onPress={() => void handleCreate()}
            disabled={loading || name.trim().length === 0 || (pinEnabled && pin.length !== PIN_LENGTH)}
            loading={loading}
            style={styles.button}
          >
            <ThemedText variant="button" themeColor="primaryText">
              {loading ? 'Creating…' : 'Continue'}
            </ThemedText>
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.back()}
            disabled={loading}
            style={styles.cancelButton}
          >
            <ThemedText variant="button">Cancel</ThemedText>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 32 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarCircle: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40 },
  input: { marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actions: { alignItems: 'center' },
  button: { alignSelf: 'stretch', marginBottom: 12 },
  cancelButton: { alignSelf: 'stretch' },
});

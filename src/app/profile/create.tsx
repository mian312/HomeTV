/**
 * Profile Create screen — name + optional avatar.
 * Full implementation in T046. This stub creates a profile and navigates home.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, Input } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';

export default function ProfileCreateScreen() {
  const { colors, spacing } = useTheme();
  const boot = useSessionStore((s) => s.boot);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a profile name.');
      return;
    }
    setLoading(true);
    try {
      const profile = await profileRepository.create({ name: trimmed });
      await profileRepository.saveLastActiveId(profile.id);
      boot({ status: 'ready', profile });
      // Navigate to onboarding (T052) — use home for now.
      router.replace('/' as any);
    } catch {
      Alert.alert('Error', 'Could not create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        Create Profile
      </ThemedText>
      <Input
        label="Name"
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        autoFocus
        maxLength={40}
        containerStyle={styles.input}
      />
      <Button
        onPress={() => void handleCreate()}
        disabled={loading || name.trim().length === 0}
        loading={loading}
        style={styles.button}
      >
        <ThemedText variant="button" themeColor="primaryText">
          {loading ? 'Creating…' : 'Create Profile'}
        </ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { alignSelf: 'stretch' },
});

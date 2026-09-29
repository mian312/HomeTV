/**
 * Profile Unlock screen — PIN entry for locked profiles.
 * Full implementation in T040/T091. This stub renders a placeholder.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';

export default function ProfileUnlockScreen() {
  const { colors, spacing } = useTheme();
  const { activeProfile, leaveProfile } = useSessionStore();

  function handleLeave() {
    leaveProfile();
    router.replace('/profile/select' as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        {activeProfile ? `Welcome back, ${activeProfile.name}` : 'Unlock Profile'}
      </ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        PIN entry coming soon (T040).
      </ThemedText>
      <Button variant="outline" onPress={handleLeave} style={styles.button}>
        <ThemedText variant="body">Switch Profile</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 32 },
  button: { alignSelf: 'stretch' },
});

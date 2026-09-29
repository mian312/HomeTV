/**
 * Profile Select screen — lists all profiles and lets the user pick one.
 * Full implementation in T044/T045. This stub prevents navigation crashes.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, LoadingView } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import type { Profile } from '@/types/domain';

export default function ProfileSelectScreen() {
  const { colors, spacing } = useTheme();
  const boot = useSessionStore((s) => s.boot);
  const [profiles, setProfiles] = useState<readonly Profile[] | null>(null);

  useEffect(() => {
    void profileRepository.getAll().then(setProfiles);
  }, []);

  async function handleSelectProfile(profile: Profile) {
    if (profile.pinEnabled) {
      boot({ status: 'locked', profile });
      router.replace('/profile/unlock' as any);
    } else {
      boot({ status: 'ready', profile });
      await profileRepository.saveLastActiveId(profile.id);
      router.replace('/' as any);
    }
  }

  function handleCreateProfile() {
    router.replace('/profile/create' as any);
  }

  if (profiles === null) return <LoadingView message="Loading profiles…" />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        Who&apos;s watching?
      </ThemedText>

      <View style={{ gap: spacing.md, marginVertical: spacing.xl }}>
        {profiles.map((p) => (
          <Button
            key={p.id}
            variant="secondary"
            onPress={() => void handleSelectProfile(p)}
            style={styles.profileButton}
          >
            <ThemedText variant="body">{p.name}</ThemedText>
          </Button>
        ))}
      </View>

      <Button variant="outline" onPress={handleCreateProfile} style={styles.addButton}>
        <ThemedText variant="body">Add Profile</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 8 },
  profileButton: { alignSelf: 'stretch' },
  addButton: { marginTop: 8, alignSelf: 'stretch' },
});

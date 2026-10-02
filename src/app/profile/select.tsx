/**
 * Profile Select screen — lists all profiles and lets the user pick one.
 * Full implementation in T044/T045. This stub prevents navigation crashes.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, LoadingView, ProfileAvatar } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import type { Profile } from '@/types/domain';

export default function ProfileSelectScreen() {
  const { colors, spacing } = useTheme();
  const { switchProfile } = useSessionStore();
  const [profiles, setProfiles] = useState<readonly Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfiles() {
    try {
      setError(null);
      const list = await profileRepository.getAll();
      setProfiles(list);
    } catch {
      setError('Failed to load profiles.');
      setProfiles([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfiles();
  }, []);

  async function handleSelectProfile(profile: Profile) {
    if (!profile.pinEnabled) {
      await profileRepository.saveLastActiveId(profile.id);
      switchProfile(profile);
      router.replace('/' as any);
    } else {
      switchProfile(profile);
    }
  }

  function handleCreateProfile() {
    router.replace('/profile/create' as any);
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <ThemedText variant="body" themeColor="error" style={{ textAlign: 'center', marginBottom: spacing.md }}>
          {error}
        </ThemedText>
        <Button variant="outline" onPress={() => void loadProfiles()}>
          <ThemedText variant="button">Retry</ThemedText>
        </Button>
      </View>
    );
  }

  if (profiles === null) return <LoadingView message="Loading profiles…" />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        Who&apos;s watching?
      </ThemedText>

      {profiles.length === 0 ? (
        <View style={{ marginVertical: spacing.xl, alignItems: 'center' }}>
          <ThemedText variant="body" themeColor="textSecondary">
            No profiles found. Create one to get started.
          </ThemedText>
        </View>
      ) : (
        <View style={{ gap: spacing.md, marginVertical: spacing.xl }}>
          {profiles.map((p) => (
            <Button
              key={p.id}
              variant="secondary"
              onPress={() => void handleSelectProfile(p)}
              style={styles.profileButton}
            >
              <View style={styles.profileInfo}>
                <ProfileAvatar name={p.name} avatarKey={p.avatarKey} size={32} />
                <ThemedText variant="body" style={{ marginLeft: spacing.md, flex: 1 }}>{p.name}</ThemedText>
              </View>
            </Button>
          ))}
        </View>
      )}

      <Button variant="outline" onPress={handleCreateProfile} style={styles.addButton}>
        <ThemedText variant="body">Add Profile</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 8 },
  profileButton: { alignSelf: 'stretch', justifyContent: 'flex-start' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  addButton: { marginTop: 8, alignSelf: 'stretch' },
});

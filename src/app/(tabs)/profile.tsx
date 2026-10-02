import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { Button, ProfileAvatar, LoadingView } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import type { Profile } from '@/types/domain';

export default function ProfileTabScreen() {
  const { colors, spacing } = useTheme();
  const { activeProfile, switchProfile } = useSessionStore();
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

  useFocusEffect(
    useCallback(() => {
      void loadProfiles();
    }, [])
  );

  async function handleSelectProfile(profile: Profile) {
    if (profile.id === activeProfile?.id) return;
    
    if (!profile.pinEnabled) {
      await profileRepository.saveLastActiveId(profile.id);
      switchProfile(profile);
      router.replace('/' as any);
    } else {
      switchProfile(profile);
    }
  }

  function handleCreateProfile() {
    router.push('/profile/create' as any);
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xl }]}>
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.xl }}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        Profiles
      </ThemedText>

      {profiles.length === 0 ? (
        <View style={{ marginVertical: spacing.xl, alignItems: 'center' }}>
          <ThemedText variant="body" themeColor="textSecondary">
            No profiles found.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.list, { gap: spacing.md }]}>
          {profiles.map((p) => {
            const isActive = p.id === activeProfile?.id;
            return (
              <Button
                key={p.id}
                variant={isActive ? 'default' : 'secondary'}
                onPress={() => void handleSelectProfile(p)}
                style={styles.profileRow}
              >
                <View style={styles.profileInfo}>
                  <ProfileAvatar name={p.name} avatarKey={p.avatarKey} size={32} />
                  <ThemedText variant="body" style={{ marginLeft: spacing.md, flex: 1 }}>
                    {p.name}
                  </ThemedText>
                </View>
                <View style={styles.actions}>
                  {p.pinEnabled && (
                    <MaterialCommunityIcons name="lock" size={20} color={isActive ? colors.primaryText : colors.text} />
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onPress={() => router.push(`/profile/edit?id=${p.id}` as any)}
                    accessibilityLabel={`Edit ${p.name}`}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={isActive ? colors.primaryText : colors.text} />
                  </Button>
                </View>
              </Button>
            );
          })}
        </View>
      )}

      <Button variant="outline" onPress={handleCreateProfile} style={styles.addButton}>
        <ThemedText variant="body">Add Profile</ThemedText>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { marginBottom: 24 },
  list: { marginBottom: 24 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: { alignSelf: 'stretch' },
});

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import type { Profile } from '@/types/domain';

export default function ProfileTabScreen() {
  const { colors, spacing } = useTheme();
  const { activeProfile, switchProfile } = useSessionStore();
  const [profiles, setProfiles] = useState<readonly Profile[]>([]);

  async function loadProfiles() {
    const list = await profileRepository.getAll();
    setProfiles(list);
  }

  useFocusEffect(
    useCallback(() => {
      void loadProfiles();
    }, [])
  );

  async function handleSelectProfile(profile: Profile) {
    if (profile.id === activeProfile?.id) return;
    
    switchProfile(profile);
    if (profile.pinEnabled) {
      router.push('/profile/unlock' as any);
    } else {
      await profileRepository.saveLastActiveId(profile.id);
      router.replace('/' as any);
    }
  }

  function handleCreateProfile() {
    router.push('/profile/create' as any);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.xl }}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        Profiles
      </ThemedText>

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
                {p.avatarKey ? (
                  <ThemedText variant="headlineSmall">{p.avatarKey}</ThemedText>
                ) : (
                  <View style={[styles.placeholderAvatar, { backgroundColor: colors.border }]} />
                )}
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
                >
                  <MaterialCommunityIcons name="pencil" size={20} color={isActive ? colors.primaryText : colors.text} />
                </Button>
              </View>
            </Button>
          );
        })}
      </View>

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
  placeholderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  addButton: { alignSelf: 'stretch' },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, Input, LoadingView } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import type { Profile, ProfileId } from '@/types/domain';

export default function ProfileEditScreen() {
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { activeProfile, refreshActiveProfile } = useSessionStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    void profileRepository.getById(id as ProfileId).then((p) => {
      if (p) {
        setProfile(p);
        setName(p.name);
        setAvatarKey(p.avatarKey || '');
      } else {
        router.back();
      }
      setInitialising(false);
    });
  }, [id]);

  async function handleSave() {
    if (!profile) return;
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a profile name.');
      return;
    }

    setLoading(true);
    try {
      const finalAvatarKey = avatarKey.trim() || null;
      await profileRepository.update(profile.id, { 
        name: trimmedName, 
        avatarKey: finalAvatarKey,
      });

      // If we are editing the currently active profile, update the session store
      if (activeProfile?.id === profile.id) {
        const updated = await profileRepository.getById(profile.id);
        if (updated) {
          refreshActiveProfile(updated);
        }
      }

      router.back();
    } catch {
      Alert.alert('Error', 'Could not save profile changes.');
      setLoading(false);
    }
  }

  if (initialising) {
    return <LoadingView message="Loading profile…" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <ThemedText variant="headlineLarge" style={styles.title}>
        Edit Profile
      </ThemedText>

      <Input
        label="Name"
        placeholder="Profile Name"
        value={name}
        onChangeText={setName}
        maxLength={40}
        containerStyle={styles.input}
      />

      <Input
        label="Avatar Emoji"
        placeholder="e.g. 🦊"
        value={avatarKey}
        onChangeText={setAvatarKey}
        maxLength={2}
        containerStyle={styles.input}
      />

      <Button
        onPress={() => void handleSave()}
        disabled={loading || name.trim().length === 0}
        loading={loading}
        style={styles.button}
      >
        <ThemedText variant="button" themeColor="primaryText">
          {loading ? 'Saving…' : 'Save Changes'}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { alignSelf: 'stretch', marginTop: 8 },
  cancelButton: { alignSelf: 'stretch', marginTop: 16 },
});

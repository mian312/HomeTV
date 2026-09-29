import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Button, Input, LoadingView } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useSessionStore } from '@/stores/session';
import { profileRepository } from '@/data/repositories';
import { profileAuthenticator } from '@/features/profile/secure-store-authenticator';
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

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        router.back();
        return;
      }
      void profileRepository.getById(id as ProfileId).then((p) => {
        if (p) {
          setProfile(p);
          // Only override inputs on first load to prevent erasing active unsaved edits
          if (initialising) {
            setName(p.name);
            setAvatarKey(p.avatarKey || '');
            setInitialising(false);
          }
        } else {
          router.back();
        }
      });
    }, [id, initialising])
  );

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

  async function handleDelete() {
    if (!profile) return;
    
    // Check if it's the last profile
    const allProfiles = await profileRepository.getAll();
    if (allProfiles.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one profile.');
      return;
    }

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile.name}"? This will permanently erase this profile's favorites, playlists, and watch history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await profileRepository.delete(profile.id);
              
              // Clear PIN from secure store if it exists
              try {
                await profileAuthenticator.forceRemove(profile.id);
              } catch {}

              // If the active profile was deleted, log out
              if (activeProfile?.id === profile.id) {
                // We need leaveProfile from session store
                useSessionStore.getState().leaveProfile();
                router.replace('/profile/select' as any);
              } else {
                router.back();
              }
            } catch {
              Alert.alert('Error', 'Failed to delete profile.');
              setLoading(false);
            }
          },
        },
      ]
    );
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

      <View style={{ marginTop: spacing.xl }}>
        {profile?.pinEnabled ? (
          <>
            <Button
              variant="outline"
              onPress={() => router.push(`/profile/pin?id=${profile?.id}&action=change` as any)}
              disabled={loading}
              style={{ marginBottom: 12 }}
            >
              <ThemedText variant="button">Change PIN</ThemedText>
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push(`/profile/pin?id=${profile?.id}&action=remove` as any)}
              disabled={loading}
            >
              <ThemedText variant="button">Remove PIN</ThemedText>
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onPress={() => router.push(`/profile/pin?id=${profile?.id}&action=setup` as any)}
            disabled={loading}
          >
            <ThemedText variant="button">Set up PIN</ThemedText>
          </Button>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <Button
          variant="destructive"
          onPress={() => void handleDelete()}
          disabled={loading}
        >
          <ThemedText variant="button" style={{ color: 'white' }}>Delete Profile</ThemedText>
        </Button>
      </View>
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

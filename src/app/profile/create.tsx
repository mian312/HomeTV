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
import { profileRepository } from '@/data/repositories';

export default function ProfileCreateScreen() {
  const { colors, spacing, radius } = useTheme();
  
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a profile name.');
      return;
    }
    
    setLoading(true);
    try {
      const finalAvatarKey = avatarKey.trim() || null;
      const profile = await profileRepository.create({ 
        name: trimmedName,
        avatarKey: finalAvatarKey
      });
      
      // Navigate to onboarding flow
      router.replace(`/profile/onboarding?id=${profile.id}` as any);
    } catch {
      Alert.alert('Error', 'Could not create profile. Please try again.');
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

        <View style={[styles.actions, { marginTop: spacing.xl }]}>
          <Button
            onPress={() => void handleCreate()}
            disabled={loading || name.trim().length === 0}
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
  actions: { alignItems: 'center' },
  button: { alignSelf: 'stretch', marginBottom: 12 },
  cancelButton: { alignSelf: 'stretch' },
});

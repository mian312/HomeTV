/**
 * Profile stack layout.
 *
 * Groups all profile management routes under /profile.
 * These routes are navigated to by the session gate in the root layout.
 */

import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="select" />
      <Stack.Screen name="create" />
      <Stack.Screen name="unlock" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}

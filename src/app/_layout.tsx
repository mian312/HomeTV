/**
 * Root layout — Expo Router entry point.
 *
 * Composes the application providers and tab navigation.
 * Business logic, SQL, and feature-specific behavior do not belong here.
 */

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppProviders } from '@/lib/providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ orientation: 'portrait' }} />
        <Stack.Screen name="player/[channelId]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </AppProviders>
  );
}

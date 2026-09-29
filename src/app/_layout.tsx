/**
 * Root layout — Expo Router entry point.
 *
 * Gates app content on the session phase resolved by useBootSession().
 * The session state machine (booting → needs-profile | locked | ready)
 * is defined in src/stores/session.ts per ADR D007.
 *
 * Phase routing:
 *   booting       → AnimatedSplashOverlay stays visible (no navigation yet)
 *   needs-profile → /profile/select or /profile/create
 *   locked        → /profile/unlock
 *   ready         → normal tab navigation
 */

import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppProviders } from '@/lib/providers';
import { useBootSession } from '@/features/profile/use-boot-session';
import { useSessionStore } from '@/stores/session';

SplashScreen.preventAutoHideAsync();

function SessionGate() {
  useBootSession();
  const phase = useSessionStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'booting') return;

    if (phase === 'needs-profile') {
      router.replace('/profile/select' as any);
    } else if (phase === 'locked') {
      router.replace('/profile/unlock' as any);
    }
    // 'ready' — stay in the normal tab stack (no redirect needed)
  }, [phase]);

  return null;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <SessionGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ orientation: 'portrait' }} />
        <Stack.Screen name="player/[channelId]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </AppProviders>
  );
}

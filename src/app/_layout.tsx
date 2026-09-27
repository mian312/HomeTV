/**
 * Root layout — Expo Router entry point.
 *
 * Composes the application providers and tab navigation.
 * Business logic, SQL, and feature-specific behavior do not belong here.
 */

import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AppProviders } from '@/lib/providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <AppTabs />
    </AppProviders>
  );
}

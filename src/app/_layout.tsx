import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useThemeStore } from '@/store/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeStore((state) => state.mode);
  
  const scheme = themeMode === 'system' ? systemColorScheme : themeMode;

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

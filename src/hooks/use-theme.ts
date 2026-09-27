/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/theme';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeStore((state) => state.mode);

  const scheme = themeMode === 'system' ? systemColorScheme : themeMode;
  const theme = scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}

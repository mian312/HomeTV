/**
 * ThemeToggleWrapper — floating button that cycles theme modes.
 *
 * Uses design system tokens for spacing, radius, and elevation.
 * This is a development utility; it may be replaced by a settings
 * screen toggle in the future.
 */

import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Elevation, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/stores/theme';

export function ThemeToggleWrapper({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useThemeStore();
  const { colors } = useTheme();

  const handleToggle = () => {
    if (mode === 'system') setMode('light');
    else if (mode === 'light') setMode('dark');
    else setMode('system');
  };

  const getIcon = () => {
    if (mode === 'system') return 'settings-outline' as const;
    if (mode === 'light') return 'sunny-outline' as const;
    return 'moon-outline' as const;
  };

  return (
    <View style={styles.wrapper}>
      {children}
      <Pressable
        onPress={handleToggle}
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Switch theme. Current: ${mode}`}
      >
        <Ionicons name={getIcon()} size={24} color={colors.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: Spacing.xxxl + Spacing.sm,
    right: Spacing.xxl,
    width: MinTouchTarget + Spacing.md,
    height: MinTouchTarget + Spacing.md,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Elevation.md,
    zIndex: 999,
  },
});

import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggleWrapper({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useThemeStore();
  const colors = useTheme();

  const handleToggle = () => {
    if (mode === 'system') setMode('light');
    else if (mode === 'light') setMode('dark');
    else setMode('system');
  };

  const getIcon = () => {
    if (mode === 'system') return 'settings-outline';
    if (mode === 'light') return 'sunny-outline';
    return 'moon-outline';
  };

  return (
    <View style={styles.wrapper}>
      {children}
      <Pressable
        onPress={handleToggle}
        style={[
          styles.floatingButton,
          { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected },
        ]}
      >
        <Ionicons name={getIcon()} size={28} color={colors.text} />
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
    bottom: 40,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
});

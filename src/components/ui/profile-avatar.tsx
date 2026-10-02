import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ThemeColor } from '@/constants/theme';
import { ThemedText } from '../themed-text';

export interface ProfileAvatarProps {
  readonly name: string;
  readonly avatarKey?: string | null;
  readonly size?: number;
  readonly style?: ViewStyle;
}

const AVATAR_COLORS: ThemeColor[] = [
  'primary',
  'success',
  'warning',
  'error',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorForName(name: string): ThemeColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function isEmoji(str: string) {
  const regex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  return regex.test(str);
}

export function ProfileAvatar({ name, avatarKey, size = 48, style }: ProfileAvatarProps) {
  const { colors } = useTheme();

  const displayEmoji = avatarKey && isEmoji(avatarKey) ? avatarKey : null;
  const initials = getInitials(name);
  const themeColor = getColorForName(name);
  const backgroundColor = colors[themeColor];

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: displayEmoji ? colors.surfaceTertiary : backgroundColor,
        },
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          {
            color: displayEmoji ? colors.text : colors.textInverse, // or primaryText? textInverse guarantees high contrast on these colors
            fontSize: size * 0.45,
            lineHeight: size * 0.45 * 1.4,
          },
        ]}
      >
        {displayEmoji || initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

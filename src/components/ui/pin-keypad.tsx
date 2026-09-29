/**
 * PinKeypad — a numeric keypad for PIN entry.
 *
 * Emits the PIN when the required length is reached.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Radius } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface PinKeypadProps {
  pin: string;
  pinLength: number;
  onPinChange: (pin: string) => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

export function PinKeypad({ pin, pinLength, onPinChange, disabled }: PinKeypadProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(
    (key: string) => {
      if (disabled) return;

      if (key === 'backspace') {
        onPinChange(pin.slice(0, -1));
      } else if (key && pin.length < pinLength) {
        onPinChange(pin + key);
      }
    },
    [pin, pinLength, onPinChange, disabled],
  );

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length ? colors.primary : 'transparent',
                borderColor: i < pin.length ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.keypad}>
        {KEYS.map((key, index) => {
          if (key === '') {
            return <View key="empty" style={{ width: 80, height: 80 }} />;
          }

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                { backgroundColor: colors.backgroundElement },
                disabled && styles.keyDisabled,
              ]}
              onPress={() => handlePress(key)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              {key === 'backspace' ? (
                <MaterialCommunityIcons name="backspace-outline" size={24} color={colors.text} />
              ) : (
                <ThemedText variant="headlineLarge">{key}</ThemedText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    opacity: 0.5,
  },
});

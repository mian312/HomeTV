/**
 * Input — a themed text input field.
 *
 * Wraps RN's TextInput with design system tokens, a focus ring,
 * optional label, and optional error state.
 */

import React, { useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  /** Left-side icon or adornment. */
  leftElement?: React.ReactNode;
  /** Right-side icon or adornment. */
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Input({
  label,
  error,
  leftElement,
  rightElement,
  containerStyle,
  testID,
  ...textInputProps
}: InputProps) {
  const { colors, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <ThemedText variant="titleSmall" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.backgroundElement,
            borderColor,
            borderWidth: focused || !!error ? 1.5 : 1,
          },
        ]}
      >
        {leftElement ? <View style={styles.adornment}>{leftElement}</View> : null}

        <TextInput
          {...textInputProps}
          testID={testID}
          onFocus={(e) => {
            setFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            textInputProps.onBlur?.(e);
          }}
          style={[typography.body, styles.textInput, { color: colors.text }]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
        />

        {rightElement ? <View style={styles.adornment}>{rightElement}</View> : null}
      </View>

      {error ? (
        <ThemedText variant="caption" style={{ color: colors.error, marginTop: Spacing.xxs }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xxs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  adornment: {
    marginHorizontal: Spacing.xs,
  },
});

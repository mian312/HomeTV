import React from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PinKeypad } from '@/components/ui';
import { PIN_LENGTH } from '@/features/profile/pin-authenticator';

interface PinStepProps {
  pin: string;
  onChange: (pin: string) => void;
}

export function PinStep({ pin, onChange }: PinStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>
          Set an optional {PIN_LENGTH}-digit PIN to lock this profile.
        </ThemedText>
      </View>

      <PinKeypad
        pin={pin}
        pinLength={PIN_LENGTH}
        onPinChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  header: { marginBottom: 32, paddingHorizontal: 16 },
});

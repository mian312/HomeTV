import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { Button } from './button';
import { Input } from './input';

import type { PickerItem } from './modal-picker';

export interface ModalMultiPickerProps<T> {
  readonly items: readonly PickerItem<T>[];
  readonly selectedValues: readonly T[];
  readonly onValuesChange: (values: T[]) => void;
  readonly placeholder?: string;
  readonly title?: string;
}

export function ModalMultiPicker<T>({
  items,
  selectedValues,
  onValuesChange,
  placeholder = 'Select...',
  title = 'Select Item',
}: ModalMultiPickerProps<T>) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayLabel = selectedValues.length > 0 
    ? `${selectedValues.length} selected`
    : placeholder;

  const toggleValue = (value: T) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter(v => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  return (
    <>
      <View style={styles.triggerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            {
              backgroundColor: selectedValues.length > 0 ? colors.backgroundSelected : colors.backgroundElement,
              borderColor: selectedValues.length > 0 ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${displayLabel}`}
        >
          <ThemedText
            style={{ color: selectedValues.length > 0 ? colors.primary : colors.textSecondary }}
            numberOfLines={1}
          >
            {displayLabel}
          </ThemedText>
        </Pressable>
        {selectedValues.length > 0 ? (
          <Pressable
            onPress={() => onValuesChange([])}
            style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.65 }]}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${title.toLowerCase()} filter`}
            testID={`modal-picker-clear-${title}`}
            hitSlop={8}
          >
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
              size={20}
              tintColor={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText variant="titleLarge" style={styles.title}>
              {title}
            </ThemedText>
            <Button variant="ghost" onPress={() => setVisible(false)}>
              <ThemedText themeColor="text">Done</ThemedText>
            </Button>
          </View>

          <Input
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.search}
          />

          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.label}-${index}`}
            ListHeaderComponent={() => (
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor:
                      selectedValues.length === 0 ? colors.backgroundSelected : 'transparent',
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => onValuesChange([])}
              >
                <ThemedText
                  style={{ color: selectedValues.length === 0 ? colors.primary : colors.text }}
                >
                  None / All
                </ThemedText>
              </Pressable>
            )}
            renderItem={({ item }) => {
              const isSelected = selectedValues.includes(item.value);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: isSelected ? colors.backgroundSelected : 'transparent' },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => toggleValue(item.value)}
                >
                  <View style={styles.itemRow}>
                    <ThemedText style={{ color: isSelected ? colors.primary : colors.text, flex: 1 }}>
                      {item.label}
                    </ThemedText>
                    {isSelected && (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={20}
                        tintColor={colors.primary}
                      />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trigger: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  clearButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
  },
  search: {
    margin: Spacing.md,
  },
  item: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { Button } from './button';
import { Input } from './input';

export interface PickerItem<T> {
  readonly label: string;
  readonly value: T;
}

export interface ModalPickerProps<T> {
  readonly items: readonly PickerItem<T>[];
  readonly selectedValue: T | null;
  readonly onValueChange: (value: T | null) => void;
  readonly placeholder?: string;
  readonly title?: string;
}

export function ModalPicker<T>({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select...',
  title = 'Select Item',
}: ModalPickerProps<T>) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = items.find((i) => i.value === selectedValue);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <View style={styles.triggerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${selectedItem?.label ?? placeholder}`}
        >
          <ThemedText
            style={{ color: selectedItem ? colors.text : colors.textSecondary }}
            numberOfLines={1}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </ThemedText>
        </Pressable>
        {selectedItem ? (
          <Pressable
            onPress={() => onValueChange(null)}
            style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.65 }]}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${title.toLowerCase()} filter`}
            testID="modal-picker-clear"
            hitSlop={8}
          >
            <SymbolView name="xmark.circle.fill" size={20} tintColor={colors.textSecondary} />
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
              <ThemedText themeColor="text">Close</ThemedText>
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
                      selectedValue === null ? colors.backgroundSelected : 'transparent',
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  onValueChange(null);
                  setVisible(false);
                }}
              >
                <ThemedText
                  style={{ color: selectedValue === null ? colors.primary : colors.text }}
                >
                  None / All
                </ThemedText>
              </Pressable>
            )}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: isSelected ? colors.backgroundSelected : 'transparent' },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                >
                  <ThemedText style={{ color: isSelected ? colors.primary : colors.text }}>
                    {item.label}
                  </ThemedText>
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
});

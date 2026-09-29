import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export const AVAILABLE_HOME_SECTIONS = [
  { id: 'recently-watched', title: 'Recently Watched', description: 'Resume channels you recently viewed' },
  { id: 'favorites', title: 'Favorites', description: 'Your saved favorite channels' },
  { id: 'categories', title: 'Categories', description: 'Browse channels by category' },
];

interface HomeStepProps {
  selectedSections: string[];
  onChange: (sections: string[]) => void;
}

export function HomeStep({ selectedSections, onChange }: HomeStepProps) {
  const { colors, spacing, radius } = useTheme();

  // If no sections are selected yet (initial state), populate with defaults
  React.useEffect(() => {
    if (selectedSections.length === 0) {
      onChange(AVAILABLE_HOME_SECTIONS.map((s) => s.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSections = selectedSections;
  const inactiveSections = AVAILABLE_HOME_SECTIONS.filter((s) => !activeSections.includes(s.id));

  function moveUp(index: number) {
    if (index === 0) return;
    const newSections = [...activeSections];
    const temp = newSections[index - 1];
    newSections[index - 1] = newSections[index];
    newSections[index] = temp;
    onChange(newSections);
  }

  function moveDown(index: number) {
    if (index === activeSections.length - 1) return;
    const newSections = [...activeSections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    onChange(newSections);
  }

  function toggle(id: string) {
    if (activeSections.includes(id)) {
      onChange(activeSections.filter((s) => s !== id));
    } else {
      onChange([...activeSections, id]);
    }
  }

  function renderItem(id: string, index?: number, isActive = false) {
    const def = AVAILABLE_HOME_SECTIONS.find((s) => s.id === id);
    if (!def) return null;

    return (
      <View
        key={id}
        style={[
          styles.item,
          {
            backgroundColor: isActive ? colors.primaryMuted : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
            borderRadius: radius.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ThemedText variant="titleSmall">{def.title}</ThemedText>
          <ThemedText variant="bodySmall" style={{ opacity: 0.7 }}>
            {def.description}
          </ThemedText>
        </View>

        {isActive && typeof index === 'number' && (
          <View style={styles.reorderButtons}>
            <TouchableOpacity onPress={() => moveUp(index)} disabled={index === 0} style={{ padding: 4, opacity: index === 0 ? 0.3 : 1 }}>
              <MaterialCommunityIcons name="chevron-up" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveDown(index)} disabled={index === activeSections.length - 1} style={{ padding: 4, opacity: index === activeSections.length - 1 ? 0.3 : 1 }}>
              <MaterialCommunityIcons name="chevron-down" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => toggle(id)} style={{ paddingLeft: spacing.md }}>
          <MaterialCommunityIcons
            name={isActive ? "check-circle" : "circle-outline"}
            size={28}
            color={isActive ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText variant="bodySmall" style={{ opacity: 0.7, marginBottom: spacing.md }}>
        Active Sections (use arrows to reorder)
      </ThemedText>
      
      {activeSections.length > 0 ? (
        activeSections.map((id, idx) => renderItem(id, idx, true))
      ) : (
        <View style={[styles.empty, { borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.lg }]}>
          <ThemedText style={{ opacity: 0.7 }}>No sections active</ThemedText>
        </View>
      )}

      {inactiveSections.length > 0 && (
        <>
          <ThemedText variant="bodySmall" style={{ opacity: 0.7, marginTop: spacing.md, marginBottom: spacing.md }}>
            Available Sections
          </ThemedText>
          {inactiveSections.map((s) => renderItem(s.id, undefined, false))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  reorderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  }
});

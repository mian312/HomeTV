import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Channel } from '@/types/domain';

interface ChannelDetailsProps {
  readonly channel: Channel;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function ChannelDetails({ channel, visible, onClose }: ChannelDetailsProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close channel details"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.backgroundElevated }]}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.identity}>
                {channel.logoUrl ? (
                  <Image
                    source={{ uri: channel.logoUrl }}
                    style={[styles.logo, { backgroundColor: colors.backgroundElement }]}
                    contentFit="contain"
                  />
                ) : (
                  <View
                    style={[
                      styles.logo,
                      styles.initials,
                      { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    <ThemedText variant="titleLarge" themeColor="textSecondary">
                      {channel.name.slice(0, 2).toUpperCase()}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.titleBlock}>
                  <ThemedText variant="headlineSmall" numberOfLines={2}>
                    {channel.name}
                  </ThemedText>
                  <ThemedText variant="bodySmall" themeColor="textSecondary">
                    Channel details
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close channel details"
                hitSlop={8}
                style={styles.closeButton}
              >
                <SymbolView name="xmark" size={19} tintColor={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.metadata}>
              <DetailField label="Country" value={channel.country} />
              <DetailField label="Network" value={channel.network} />
              <DetailField label="Categories" value={channel.categories.join(', ')} />
              <DetailField label="Languages" value={channel.languages.join(', ')} />
              <DetailField label="Website" value={channel.website} />
              <DetailField label="Launched" value={channel.launched} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailField({ label, value }: { readonly label: string; readonly value: string | null }) {
  const { colors } = useTheme();
  if (!value) return null;

  return (
    <View style={styles.detailField}>
      <ThemedText variant="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText variant="bodySmall" style={{ color: colors.text }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.xxs,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadata: {
    gap: Spacing.md,
  },
  detailField: {
    gap: Spacing.xxs,
  },
});

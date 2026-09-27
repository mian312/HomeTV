import { useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SlideUpSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}

export function shouldDismissAfterDrag(distanceY: number, velocityY: number): boolean {
  return distanceY > 110 || velocityY > 0.9;
}

export function SlideUpSheet({ visible, onClose, children }: SlideUpSheetProps) {
  const { colors } = useTheme();
  const [translateY] = useState(() => new Animated.Value(0));
  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (shouldDismissAfterDrag(gesture.dy, gesture.vy)) {
          onClose();
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  );

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close panel"
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.backgroundElevated, transform: [{ translateY }] },
          ]}
        >
          <View
            {...panResponder.panHandlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Drag down to close"
            style={styles.dragArea}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    height: '92%',
    alignSelf: 'center',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',
  },
  dragArea: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: Radius.full,
  },
});

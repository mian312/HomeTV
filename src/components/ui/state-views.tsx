/**
 * State views — reusable full-area loading, empty, and error states.
 *
 * Every async list flow must model these states explicitly. Import the
 * matching view and render it inside a list's ListEmptyComponent or
 * as the screen body.
 *
 * Usage:
 *   if (isLoading) return <LoadingView />;
 *   if (isError)   return <ErrorView message={error.message} onRetry={refetch} />;
 *   if (!data.length) return <EmptyView message="No channels found." />;
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

// ---------------------------------------------------------------------------
// Shared container
// ---------------------------------------------------------------------------

function StateContainer({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return <View style={[styles.container, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// LoadingView
// ---------------------------------------------------------------------------

export interface LoadingViewProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingView({ message, style }: LoadingViewProps) {
  const { colors } = useTheme();
  return (
    <StateContainer style={style}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <ThemedText variant="bodySmall" themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
    </StateContainer>
  );
}

// ---------------------------------------------------------------------------
// EmptyView
// ---------------------------------------------------------------------------

export interface EmptyViewProps {
  message?: string;
  /** Optional icon or illustration element. */
  icon?: React.ReactNode;
  /** Optional CTA button element. */
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyView({
  message = 'Nothing here yet.',
  icon,
  action,
  style,
}: EmptyViewProps) {
  return (
    <StateContainer style={style}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <ThemedText variant="bodySmall" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      {action ? <View style={styles.action}>{action}</View> : null}
    </StateContainer>
  );
}

// ---------------------------------------------------------------------------
// ErrorView
// ---------------------------------------------------------------------------

export interface ErrorViewProps {
  message?: string;
  /** Retry callback — renders a "Try again" button when supplied. */
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorView({
  message = 'Something went wrong.',
  onRetry,
  style,
}: ErrorViewProps) {
  const { colors } = useTheme();

  return (
    <StateContainer style={style}>
      <ThemedText variant="titleSmall" style={{ color: colors.error, textAlign: 'center' }}>
        {message}
      </ThemedText>

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <ThemedText variant="button" style={{ color: colors.primary }}>
            Try again
          </ThemedText>
        </Pressable>
      ) : null}
    </StateContainer>
  );
}

// ---------------------------------------------------------------------------
// OfflineView — specific offline/network error state
// ---------------------------------------------------------------------------

export interface OfflineViewProps {
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function OfflineView({ onRetry, style }: OfflineViewProps) {
  return (
    <ErrorView
      message="You're offline. Check your connection and try again."
      onRetry={onRetry}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  icon: {
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.sm,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

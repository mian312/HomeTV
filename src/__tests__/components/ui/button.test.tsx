/**
 * Tests for the Button component.
 *
 * Tests cover: rendering, variants, disabled state, loading state, press handler.
 * We do NOT test animation internals (Reanimated); those are implementation details.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Button } from '@/components/ui/button';

// Minimal wrapper — Button uses useTheme() which reads from Zustand + RN ColorScheme
// Both work fine in the test environment (Zustand is in-memory, ColorScheme defaults to 'light')

describe('Button', () => {
  it('renders children', () => {
    render(
      <Button>
        <Text>Press me</Text>
      </Button>,
    );
    expect(screen.getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <Button onPress={onPress}>
        <Text>Tap</Text>
      </Button>,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(
      <Button disabled onPress={onPress}>
        <Text>Tap</Text>
      </Button>,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(
      <Button loading onPress={onPress}>
        <Text>Tap</Text>
      </Button>,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    render(
      <Button loading>
        <Text>Tap</Text>
      </Button>,
    );
    // Children are replaced by the spinner when loading
    expect(screen.queryByText('Tap')).toBeNull();
  });

  it('has correct accessibilityRole', () => {
    render(
      <Button accessibilityLabel="Submit form">
        <Text>Submit</Text>
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Submit form' })).toBeTruthy();
  });

  it('has disabled accessibilityState when disabled', () => {
    render(
      <Button disabled>
        <Text>X</Text>
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it.each(['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const)(
    'renders variant "%s" without error',
    (variant) => {
      expect(() =>
        render(
          <Button variant={variant}>
            <Text>{variant}</Text>
          </Button>,
        ),
      ).not.toThrow();
    },
  );
});

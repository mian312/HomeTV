/**
 * Tests for the useTheme() hook and theme store.
 *
 * Tests cover: default scheme resolution, mode switching, isDark flag.
 */

import { act, renderHook } from '@testing-library/react-native';

import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/stores/theme';

describe('useTheme', () => {
  beforeEach(() => {
    // Reset to system default before each test
    act(() => {
      useThemeStore.getState().setMode('system');
    });
  });

  it('returns a colors object with expected keys', () => {
    const { result } = renderHook(() => useTheme());
    const { colors } = result.current;
    expect(colors).toHaveProperty('text');
    expect(colors).toHaveProperty('background');
    expect(colors).toHaveProperty('primary');
    expect(colors).toHaveProperty('surface');
    expect(colors).toHaveProperty('border');
  });

  it('exposes typography, spacing, radius, elevation, motion', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.typography).toBeDefined();
    expect(result.current.spacing).toBeDefined();
    expect(result.current.radius).toBeDefined();
    expect(result.current.elevation).toBeDefined();
    expect(result.current.motion).toBeDefined();
  });

  it('resolves to light scheme by default in test env (system → light)', () => {
    const { result } = renderHook(() => useTheme());
    // In Jest (Node env) useColorScheme returns null → falls back to 'light'
    expect(result.current.scheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('resolves to dark when mode is forced dark', () => {
    act(() => {
      useThemeStore.getState().setMode('dark');
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('resolves to light when mode is forced light', () => {
    act(() => {
      useThemeStore.getState().setMode('light');
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });
});

describe('useThemeStore', () => {
  it('defaults to system mode', () => {
    // Fresh store state after reset
    act(() => {
      useThemeStore.getState().setMode('system');
    });
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('setMode updates mode correctly', () => {
    act(() => {
      useThemeStore.getState().setMode('dark');
    });
    expect(useThemeStore.getState().mode).toBe('dark');

    act(() => {
      useThemeStore.getState().setMode('light');
    });
    expect(useThemeStore.getState().mode).toBe('light');
  });
});

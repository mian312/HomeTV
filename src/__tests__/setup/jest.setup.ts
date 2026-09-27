/**
 * Jest global setup — runs before each test file.
 *
 * Mocks modules that are unavailable in a Node/JSDOM test environment.
 * Keep this file minimal; per-test mocks belong in the test files themselves.
 */

// Mock react-native-reanimated — minimal manual mock to avoid native module deps
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View,
    // createAnimatedComponent must return a valid component
    createAnimatedComponent: (Component: React.ComponentType<any>) => Component,
  };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: (cb: () => object) => cb(),
    withTiming: (toValue: unknown) => toValue,
    withRepeat: (value: unknown) => value,
    withSequence: (...args: unknown[]) => args[0],
    interpolateColor: (_value: unknown, _input: unknown[], output: string[]) => output[0],
    FadeIn: { duration: () => ({ duration: () => ({}) }) },
    Easing: { elastic: () => () => 0, linear: () => 0 },
    Keyframe: class {},
    createAnimatedComponent: (Component: React.ComponentType<any>) => Component,
  };
});

// Mock react-native-worklets (required by Reanimated; has no test environment support)
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: Function, ...args: unknown[]) => fn(...args),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router (navigation primitives not available in tests)
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons — return a simple View so icon renders don't crash
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const MockIcon = () => View;
  return new Proxy({}, {
    get: () => MockIcon,
  });
});

// Jest configuration for Expo SDK 57 / React Native 0.86 / React 19.
// See src/test/setup.tsx for shared render helpers used by component tests.
const nativeModulePackages = [
  'react-native',
  '@react-native',
  '@react-native-community',
  'expo',
  'expo-.*',
  '@expo',
  '@expo/.*',
  '@expo-google-fonts/.*',
  'react-navigation',
  '@react-navigation/.*',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-safe-area-context',
  'react-native-screens',
  '@shopify/flash-list',
  '@gorhom/bottom-sheet',
  'nativewind',
  'react-native-css-interop',
];

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.tsx'],
  transformIgnorePatterns: [`node_modules/(?!(?:.pnpm/)?(?:${nativeModulePackages.join('|')}))`],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/repositories/seed.ts'],
};

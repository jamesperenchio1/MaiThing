// Manual Jest mock for react-native-reanimated.
//
// Reanimated 4 initializes a native worklets module (react-native-worklets) as a side
// effect of import, which throws under the Jest/Node test environment (no native binary).
// The library no longer ships its own Jest test helper for this version, so this stand-in
// implements the subset of the API the app actually uses: hooks resolve synchronously and
// animation helpers just return their target value immediately, with no real animation.
//
// Jest auto-discovers this file because it lives in `__mocks__` adjacent to `node_modules`
// at the project root — no explicit `jest.mock('react-native-reanimated')` call is required.
const React = require('react');
const RN = require('react-native');

function useSharedValue(initial) {
  const ref = React.useRef({ value: initial });
  return ref.current;
}

function useAnimatedStyle(styleFactory) {
  return styleFactory();
}

function useAnimatedRef() {
  return React.useRef(null);
}

function useReducedMotion() {
  return false;
}

const withSpring = (toValue) => toValue;
const withTiming = (toValue) => toValue;
const withDelay = (_delay, animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1];
const withRepeat = (animation) => animation;

function createAnimatedComponent(Component) {
  return Component;
}

const Animated = {
  View: RN.View,
  Text: RN.Text,
  ScrollView: RN.ScrollView,
  Image: RN.Image,
  FlatList: RN.FlatList,
  createAnimatedComponent,
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useReducedMotion,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  configureReanimatedLogger: () => {},
  ReanimatedLogLevel: { warn: 'warn', error: 'error' },
  FadeIn: { duration: () => ({ delay: () => ({}) }) },
  FadeInUp: { duration: () => ({ delay: () => ({}) }) },
  FadeInDown: { duration: () => ({ delay: () => ({}) }) },
  FadeOut: { duration: () => ({}) },
};

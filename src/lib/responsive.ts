import { useWindowDimensions, PixelRatio } from 'react-native';

// Reference design width in logical points (iPhone 14 / similar Android)
const BASE_WIDTH = 390;

// Clamp scale so typography/layout never becomes unusable on tiny/tablet screens.
export const MIN_SCALE = 0.9;
export const MAX_SCALE = 1.25;

/**
 * Returns a responsive scale factor based on the current screen width.
 * The returned scale is clamped between MIN_SCALE and MAX_SCALE so that
 * small phones don't shrink below readable sizes and tablets don't blow up.
 */
export function getScale(width: number): number {
  return Math.min(Math.max(width / BASE_WIDTH, MIN_SCALE), MAX_SCALE);
}

/**
 * Hook version of getScale. Use this inside components that already have
 * access to hooks. Also returns the raw window dimensions for one-off sizing.
 */
export function useResponsiveScale() {
  const { width, height, scale: pixelScale, fontScale } = useWindowDimensions();
  const scale = getScale(width);
  return { scale, width, height, pixelScale, fontScale };
}

/**
 * Scale a numeric dimension (margin, padding, height, icon size, etc.) by the
 * current responsive scale. Always returns an integer number of logical points.
 */
export function scaledSize(value: number, width?: number): number {
  const s = width != null ? getScale(width) : getScale(BASE_WIDTH);
  return Math.round(value * s);
}

/**
 * Hook version of scaledSize. Convenient for scaling many values at once.
 */
export function useScaledSize() {
  const { width } = useWindowDimensions();
  const scale = getScale(width);
  return {
    scale,
    s: (value: number) => Math.round(value * scale),
  };
}

/**
 * Font scale multiplier. Combines responsive width scaling with the user's
 * system font-size setting, capped to prevent extreme layout breakage.
 */
export function getFontScale(width: number, systemFontScale: number): number {
  const widthScale = getScale(width);
  // Respect accessibility up to 1.3x beyond width scaling, then clamp.
  return Math.min(widthScale * Math.min(systemFontScale, 1.3), 1.4);
}

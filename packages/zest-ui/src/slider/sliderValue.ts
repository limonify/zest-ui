import type { Direction } from '../direction-provider/DirectionContext';
import type { Orientation } from '../types';

/**
 * The position → value maths, as pure functions a **worklet can call**.
 *
 * `SliderRoot` owns this arithmetic through `store.context.getValueFromPosition`,
 * which closes over the store and therefore only runs on the JS thread. That is
 * fine for the store, and useless for a consumer animating the thumb: a slider
 * drag is the one interaction where the JS round trip lands on every frame, so a
 * consumer that wants the thumb to follow the finger has to convert the touch
 * position itself, on the UI thread.
 *
 * These functions exist so it does not have to reimplement the conversion — and
 * so the two cannot drift. `SliderRoot` calls them too; there is one copy of the
 * arithmetic, not two.
 *
 * **The `'worklet'` directive is not a reanimated dependency.** It is a marker
 * that reanimated's Babel plugin compiles, and consumers build zest from source
 * (`"react-native": "./src/index.ts"`), so it is compiled by whoever installs
 * the package. Where the plugin is absent the directive is an ordinary string
 * expression and these stay plain functions — which is exactly what the JS-thread
 * caller wants anyway. zest itself still depends on nothing new.
 */

/** Clamps `value` into `[min, max]`. Worklet-safe. */
export function clampValue(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

/** How many decimals a step carries, so float error can be rounded away. */
export function countStepDecimals(value: number): number {
  'worklet';
  if (Math.floor(value) === value) {
    return 0;
  }
  // `toString()` rather than a regex on the literal: 1e-7 prints in exponential
  // form, and its decimal count is the exponent.
  const text = String(value);
  const exponent = text.indexOf('e-');
  if (exponent >= 0) {
    return Number(text.slice(exponent + 2));
  }
  const dot = text.indexOf('.');
  return dot >= 0 ? text.length - dot - 1 : 0;
}

/** Snaps `raw` to the nearest step and clamps it. Worklet-safe. */
export function roundValueToStep(raw: number, min: number, max: number, step: number): number {
  'worklet';
  const stepped = Math.round((raw - min) / step) * step + min;
  // Steps like 0.1 accumulate float error; round to the step's precision.
  const decimals = countStepDecimals(step);
  const rounded = Number(stepped.toFixed(decimals));
  return clampValue(rounded, min, max);
}

/** Everything the conversion needs that is not the touch position itself. */
export interface SliderValueGeometry {
  /** The control's length along its own axis, from `Slider.Control`'s layout. */
  controlSize: number | undefined;
  orientation: Orientation;
  direction: Direction;
  min: number;
  max: number;
  step: number;
}

/**
 * The value a touch at `position` lands on, or `undefined` before the control
 * has been laid out.
 *
 * Callers must treat `undefined` as "no value yet" rather than falling back to
 * one: a touch arriving before the first layout would otherwise snap the slider
 * to `min`.
 */
export function sliderValueFromPosition(position: number, geometry: SliderValueGeometry): number | undefined {
  'worklet';
  const { controlSize, orientation, direction, min, max, step } = geometry;
  if (!controlSize) {
    return undefined;
  }

  const ratio = clampValue(position / controlSize, 0, 1);
  // A vertical slider grows upwards, so its position axis is inverted — and so
  // is a horizontal one under RTL, where the track runs right to left. React
  // Native mirrors the layout, but the touch coordinate it reports is still
  // measured from the control's leading edge, so the value has to be flipped
  // here rather than left to the platform.
  const inverted = orientation === 'vertical' || (orientation === 'horizontal' && direction === 'rtl');
  const percent = inverted ? 1 - ratio : ratio;

  return roundValueToStep(min + percent * (max - min), min, max, step);
}

/**
 * Where a value sits along the track, as a fraction from 0 to 1.
 *
 * The inverse of `sliderValueFromPosition`, and what a consumer animating the
 * thumb actually applies. `Slider.Thumb` computes the same fraction as a
 * percentage for its own `left`/`bottom`.
 */
export function sliderPercentFromValue(value: number, min: number, max: number): number {
  'worklet';
  if (max === min) {
    return 0;
  }
  return clampValue((value - min) / (max - min), 0, 1);
}

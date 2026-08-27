export * as Slider from './index.parts';

export type * from './root/SliderRoot';
export type * from './label/SliderLabel';
export type * from './value/SliderValue';
export type * from './control/SliderControl';
export type * from './track/SliderTrack';
export type * from './indicator/SliderIndicator';
export type * from './thumb/SliderThumb';
export { useSliderRootContext } from './root/SliderRootContext';

// The position → value arithmetic, as worklet-safe pure functions. Exported so a
// consumer animating the thumb on the UI thread converts a touch exactly the way
// the store does — see `Slider.Control`'s `simultaneousGesture`.
export {
  clampValue,
  countStepDecimals,
  roundValueToStep,
  sliderPercentFromValue,
  sliderValueFromPosition,
} from './sliderValue';
export type { SliderValueGeometry } from './sliderValue';

'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import { clamp } from '../../utils/clamp';
import { sliderValueFromPosition } from '../sliderValue';
import { AnimationFrame } from '../../hooks/useAnimationFrame';
import { useControlledProp, useContextCallback, useStateSetter } from '../../store/ReactStore';
import { SliderStore, getSliderRootState, toSliderValueArray } from '../store/SliderStore';
import type { ZestUIComponentProps, Orientation } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { SliderRootContext } from './SliderRootContext';
import { useDirection, type Direction } from '../../direction-provider/DirectionContext';

/**
 * How the thumbs of a range slider behave when one is dragged into another.
 */
export type SliderThumbCollisionBehavior = 'push' | 'swap' | 'none';

/**
 * Groups all parts of the slider.
 * Renders a `<View>`.
 *
 * Drop the web-only props: `name`/`form` (React Native has no form submission),
 * `largeStep` (a PageUp/PageDown affordance), and `thumbAlignment` — the latter
 * is pure CSS inset positioning, and here the consumer places the thumb itself
 * from `state.values`.
 */
export function SliderRoot<Value extends number | readonly number[] = number>(
  componentProps: SliderRoot.Props<Value>,
) {
  const {
    className,
    defaultValue,
    disabled: disabledProp = false,
    format,
    getAccessibilityValueText,
    locale,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    render,
    step = 1,
    style,
    thumbCollisionBehavior = 'push',
    value,
    ref,
    ...elementProps
  } = componentProps;

  const { fieldDisabled, markChanged, markTouched } = useFieldControlRegistration({
    initialValue: defaultValue ?? value,
    ownsValue: true,
  });

  const disabled = disabledProp || fieldDisabled;

  const direction = useDirection();

  // A range slider is just a slider whose value is an array; remember which
  // shape the consumer used so callbacks hand back the same one.
  const isRange = Array.isArray(value ?? defaultValue);

  const controlledValues = value === undefined ? undefined : value;
  const defaultValues =
    value !== undefined ? undefined : toSliderValueArray(defaultValue ?? (min as Value));

  // The store is created once and kept stable for the life of the root. Parts
  // subscribe to their own slice of it via `useStoreState`, so a drag re-renders
  // only the parts whose values actually changed instead of the whole subtree.
  const store = useRefWithInit(
    () =>
      new SliderStore(
        {
          values: defaultValues ?? [min as number],
          valuesProp: controlledValues,
        },
        {
          direction,
          disabled,
          format,
          getAccessibilityValueText,
          locale,
          max,
          min,
          minStepsBetweenValues,
          orientation,
          step,
          thumbCollisionBehavior,
          isRange,
        },
      ),
  ).current;

  // Non-reactive props go into the store's context. The store reference never
  // changes, so parts re-render only when the selector they subscribe to fires;
  // these fields are read at event time (gesture math) or on a part's own render.
  store.context.direction = direction;
  store.context.disabled = disabled;
  store.context.format = format;
  store.context.getAccessibilityValueText = getAccessibilityValueText;
  store.context.locale = locale;
  store.context.max = max;
  store.context.min = min;
  store.context.minStepsBetweenValues = minStepsBetweenValues;
  store.context.orientation = orientation;
  store.context.step = step;
  store.context.thumbCollisionBehavior = thumbCollisionBehavior;
  store.context.isRange = isRange;

  // A drag emits several changes in one synchronous batch — its final move and
  // its finalize land before React re-renders — so the value logic reads and
  // writes `store.liveValues`, never the committed state, which would otherwise
  // work against the previous batch's values.
  useControlledProp(store, 'valuesProp', value);
  useContextCallback(
    store,
    'onValueChange',
    onValueChange as
      | ((value: number | readonly number[], eventDetails: SliderRoot.ChangeEventDetails) => void)
      | undefined,
  );
  useContextCallback(
    store,
    'onValueCommitted',
    onValueCommitted as
      | ((value: number | readonly number[], eventDetails: SliderRoot.ChangeEventDetails) => void)
      | undefined,
  );

  // When a controlled consumer changes the value, the next drag must start from
  // where they put it — otherwise `liveValues` would still hold what the last
  // drag left behind.
  useIsoLayoutEffect(() => {
    if (value !== undefined) {
      store.liveValues = toSliderValueArray(value);
    }
  }, [value, store]);

  // The arithmetic lives in `../sliderValue`, as pure worklet-safe functions, so
  // a consumer animating the thumb on the UI thread converts a touch exactly the
  // way the store does. One copy, not two.
  const getValueFromPosition = useStableCallback((position: number) =>
    // Returns `undefined` until the control has reported its size; callers must
    // bail rather than fall back to a value, or a touch landing before the first
    // layout would snap the slider to `min`.
    sliderValueFromPosition(position, {
      controlSize: store.state.controlSize,
      orientation,
      direction,
      min,
      max,
      step,
    }),
  );

  const getClosestThumbIndex = useStableCallback((target: number) => {
    let closest = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    store.liveValues.forEach((thumbValue, index) => {
      const distance = Math.abs(thumbValue - target);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closest = index;
      }
    });

    return closest;
  });

  // The frame-coalesced commit: `store.liveValues` is the synchronous truth, and
  // `store.values` (what React sees) is updated at most once per frame. Gesture
  // events can arrive several to a frame; without this every one would re-render
  // every subscribed part.
  const commitFrame = useRefWithInit(AnimationFrame.create).current;

  const setThumbValue = useStableCallback(
    (index: number, nextValue: number, eventDetails: SliderRoot.ChangeEventDetails): number => {
      if (disabled) {
        return index;
      }

      const current = store.liveValues;
      const count = current.length;
      // `minStepsBetweenValues` is the gap thumbs must keep from each other.
      const gap = minStepsBetweenValues * step;

      let nextValues: number[];
      // A swap moves the dragged thumb to a different index; every other mode
      // leaves it where it was. The caller follows this so a drag keeps hold of
      // the same thumb.
      let nextIndex = index;

      if (thumbCollisionBehavior === 'push') {
        // The dragged thumb has to leave room on the track for everything it
        // pushes ahead of it, or the pushed thumbs would pile up past the end.
        const clamped = clamp(nextValue, min + gap * index, max - gap * (count - 1 - index));

        nextValues = current.slice();
        nextValues[index] = clamped;
        for (let j = index + 1; j < count; j += 1) {
          nextValues[j] = Math.max(nextValues[j]!, nextValues[j - 1]! + gap);
        }
        for (let j = index - 1; j >= 0; j -= 1) {
          nextValues[j] = Math.min(nextValues[j]!, nextValues[j + 1]! - gap);
        }
      } else if (thumbCollisionBehavior === 'swap') {
        const clamped = clamp(nextValue, min, max);

        // The values array is always sorted, so where the dragged value belongs
        // among the others *is* the swap: it takes that index and everything it
        // passed shifts by one. The gap is not enforced here — thumbs that are
        // allowed to pass each other cannot be held apart while they do it.
        const others = current.filter((_, j) => j !== index);
        nextIndex = others.filter((other) => other < clamped).length;
        nextValues = [...others.slice(0, nextIndex), clamped, ...others.slice(nextIndex)];
      } else {
        // `'none'`: a thumb stops at its neighbour, and the excess is dropped.
        const lowerBound = index > 0 ? current[index - 1]! + gap : min;
        const upperBound = index < count - 1 ? current[index + 1]! - gap : max;
        const clamped = clamp(nextValue, lowerBound, upperBound);

        nextValues = current.slice();
        nextValues[index] = clamped;
      }

      if (
        nextValues.length === current.length &&
        nextValues.every((next, i) => next === current[i])
      ) {
        return nextIndex;
      }

      // The veto fires synchronously on every event, exactly as before — only
      // the React-visible commit is deferred to the frame.
      onValueChange?.(fromArray(nextValues, isRange) as Value, eventDetails);

      if (eventDetails.isCanceled) {
        return nextIndex;
      }

      store.liveValues = nextValues;
      markChanged(fromArray(nextValues, isRange));

      commitFrame.request(() => {
        store.set('values', store.liveValues);
      });

      return nextIndex;
    },
  );

  const flushValues = useStableCallback(() => {
    commitFrame.cancel();
    store.set('values', store.liveValues);
  });

  const commitValue = useStableCallback((eventDetails: SliderRoot.ChangeEventDetails) => {
    onValueCommitted?.(fromArray(store.liveValues, isRange) as Value, eventDetails);
    // Releasing the thumb is the end of the interaction — a slider's blur.
    markTouched(fromArray(store.liveValues, isRange));
  });

  store.context.setControlSize = useStateSetter(store, 'controlSize');
  store.context.setDragging = useStateSetter(store, 'dragging');
  store.context.setLabelId = useStateSetter(store, 'labelId');
  store.context.setThumbValue = setThumbValue;
  store.context.getValueFromPosition = getValueFromPosition;
  store.context.getClosestThumbIndex = getClosestThumbIndex;
  store.context.commitValue = commitValue;
  store.context.flushValues = flushValues;

  // The root itself publishes a snapshot of the state. It deliberately does NOT
  // subscribe to the value selectors: the root is the one stable node in the
  // tree, and re-rendering it would re-render every part beneath it. Parts stay
  // fresh through their own subscriptions.
  const state = getSliderRootState(store);

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ 'aria-orientation': orientation }, elementProps],
  });

  return <SliderRootContext.Provider value={store}>{element}</SliderRootContext.Provider>;
}

function fromArray(values: readonly number[], isRange: boolean): number | readonly number[] {
  return isRange ? values : values[0]!;
}

export interface SliderRootState {
  /**
   * The writing direction the slider is laid out for. A horizontal slider runs
   * right to left under `'rtl'`, so position your thumb and indicator from the
   * track's *start* — React Native's direction-aware `start` style prop does
   * this for you, and `left` does not.
   */
  direction: Direction;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether a thumb is currently being dragged.
   */
  dragging: boolean;
  /**
   * The maximum allowed value.
   */
  max: number;
  /**
   * The minimum allowed value.
   */
  min: number;
  /**
   * The component orientation.
   */
  orientation: Orientation;
  /**
   * The control's length along its own axis, in points, or `undefined` before it
   * has been laid out.
   *
   * Published so a consumer can convert a touch position into a value itself —
   * see `sliderValueFromPosition` and `Slider.Control`'s `simultaneousGesture`.
   * A worklet cannot reach the store, so the geometry has to travel on the state
   * object like everything else a part needs.
   */
  controlSize: number | undefined;
  /**
   * The granularity the value moves in. Part of the same geometry as
   * `controlSize`.
   */
  step: number;
  /**
   * The current value of every thumb.
   */
  values: readonly number[];
}

export interface SliderRootProps<Value extends number | readonly number[] = number>
  extends Omit<ZestUIComponentProps<typeof View, SliderRootState>, 'value'> {
  /**
   * The value of the slider. Pass an array for a range slider.
   *
   * To render an uncontrolled slider, use the `defaultValue` prop instead.
   */
  value?: Value | undefined;
  /**
   * The initial value of the slider.
   *
   * To render a controlled slider, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Event handler called while a thumb is being dragged.
   */
  onValueChange?: ((value: Value, eventDetails: SliderRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called once the drag ends.
   */
  onValueCommitted?:
    | ((value: Value, eventDetails: SliderRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * The minimum allowed value.
   * @default 0
   */
  min?: number | undefined;
  /**
   * The maximum allowed value.
   * @default 100
   */
  max?: number | undefined;
  /**
   * The granularity the value must adhere to.
   * @default 1
   */
  step?: number | undefined;
  /**
   * Returns a human-readable text alternative for a thumb's value, announced by
   * assistive technology.
   *
   * Renamed from upstream's `getAriaValueText`: on React Native this feeds
   * `accessibilityValue.text`, not `aria-valuetext`. The third argument is the
   * thumb's index, so the two ends of a range can read differently.
   *
   * @example
   * ```tsx
   * <Slider.Root
   *   getAccessibilityValueText={(text, value, index) =>
   *     `${index === 0 ? 'Minimum' : 'Maximum'} ${text}`
   *   }
   * />
   * ```
   */
  getAccessibilityValueText?:
    | ((formattedValue: string, value: number, index: number) => string)
    | undefined;
  /**
   * The minimum number of steps to keep between the thumbs of a range slider.
   * @default 0
   */
  minStepsBetweenValues?: number | undefined;
  /**
   * How the thumbs of a range slider behave when one is dragged into another.
   *
   * - `'push'`: the dragged thumb pushes the ones in its way along the track.
   * - `'swap'`: thumbs trade places when one is dragged past another.
   *   `minStepsBetweenValues` is not enforced while they cross — thumbs allowed
   *   to pass each other cannot be held apart while they do it.
   * - `'none'`: a thumb stops at its neighbour and the excess movement is
   *   dropped.
   *
   * @default 'push'
   */
  thumbCollisionBehavior?: SliderThumbCollisionBehavior | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
  /**
   * Options for formatting the value in `Slider.Value`.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * The locale used to format the value in `Slider.Value`.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export type SliderRootChangeEventReason = typeof REASONS.drag | typeof REASONS.none;

export type SliderRootChangeEventDetails = ZestChangeEventDetails<SliderRootChangeEventReason>;

export namespace SliderRoot {
  export type State = SliderRootState;
  export type Props<Value extends number | readonly number[] = number> = SliderRootProps<Value>;
  export type ChangeEventReason = SliderRootChangeEventReason;
  export type ChangeEventDetails = SliderRootChangeEventDetails;
}

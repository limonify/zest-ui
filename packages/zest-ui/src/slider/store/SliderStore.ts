import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import type { Direction } from '../../direction-provider/DirectionContext';
import type { Orientation } from '../../types';
import type { SliderRoot, SliderRootState, SliderThumbCollisionBehavior } from '../root/SliderRoot';

/**
 * The array form of a `number | number[]` value prop. Cached by the input so a
 * selector built on it returns a referentially stable result — `useSyncExternalStore`
 * needs that, or it warns about an uncached snapshot (and a controlled single-value
 * slider would convert a fresh array on every check).
 */
const singleValueArrayCache = new Map<number | readonly number[], readonly number[]>();

export function toSliderValueArray(value: number | readonly number[]): readonly number[] {
  if (Array.isArray(value)) {
    return value;
  }

  let array = singleValueArrayCache.get(value);
  if (array === undefined) {
    array = [value as number];
    singleValueArrayCache.set(value, array);
  }
  return array;
}

export type State = {
  /**
   * The uncontrolled values. Consumers must read through the `values` selector,
   * which resolves the controlled prop first.
   */
  values: readonly number[];
  /**
   * The controlled `value` prop, when provided. Takes precedence over the
   * internal `values` state.
   */
  valuesProp: number | readonly number[] | undefined;
  /**
   * Whether a thumb is currently being dragged.
   */
  dragging: boolean;
  /**
   * The measured size of the control along its main axis, which is what turns a
   * touch position into a value.
   */
  controlSize: number | undefined;
  /**
   * The id of the `Slider.Label`, associated with every thumb. `undefined` when
   * there is no label.
   */
  labelId: string | undefined;
};

export type Context = {
  /**
   * The writing direction the slider is laid out for.
   */
  direction: Direction;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Options for formatting the value in `Slider.Value`.
   */
  format: Intl.NumberFormatOptions | undefined;
  /**
   * The consumer's text alternative for a thumb's value, if any.
   */
  getAccessibilityValueText:
    | ((formattedValue: string, value: number, index: number) => string)
    | undefined;
  /**
   * The locale used to format the value in `Slider.Value`.
   */
  locale: Intl.LocalesArgument | undefined;
  /**
   * The maximum allowed value.
   */
  max: number;
  /**
   * The minimum allowed value.
   */
  min: number;
  /**
   * The minimum number of steps to keep between the thumbs of a range slider.
   */
  minStepsBetweenValues: number;
  /**
   * The component orientation.
   */
  orientation: Orientation;
  /**
   * The granularity the value must adhere to.
   */
  step: number;
  /**
   * How the thumbs of a range slider behave when one is dragged into another.
   */
  thumbCollisionBehavior: SliderThumbCollisionBehavior;
  /**
   * Whether the consumer passed an array value (a range slider).
   */
  isRange: boolean;
  /**
   * Event handler called while a thumb is being dragged.
   */
  onValueChange:
    | ((value: number | readonly number[], eventDetails: SliderRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Event handler called once the drag ends.
   */
  onValueCommitted:
    | ((value: number | readonly number[], eventDetails: SliderRoot.ChangeEventDetails) => void)
    | undefined;
  markChanged: (value: number | readonly number[]) => void;
  markTouched: (value: number | readonly number[]) => void;
  setControlSize: (size: number) => void;
  setDragging: (dragging: boolean) => void;
  setLabelId: (id: string | undefined) => void;
  /**
   * Commits a value for one thumb, resolving collisions with its neighbours
   * according to `thumbCollisionBehavior`.
   *
   * Returns the index the thumb ended up at — `'swap'` moves it, so a drag has
   * to follow this to keep hold of the same thumb.
   */
  setThumbValue: (
    index: number,
    value: number,
    eventDetails: SliderRoot.ChangeEventDetails,
  ) => number;
  /**
   * Converts a position along the control into a value, or `undefined` while the
   * control has not been measured yet.
   */
  getValueFromPosition: (position: number) => number | undefined;
  /**
   * The index of the thumb closest to a value, used to pick which thumb a drag
   * should move.
   */
  getClosestThumbIndex: (value: number) => number;
  commitValue: (eventDetails: SliderRoot.ChangeEventDetails) => void;
  /**
   * Applies the drag's latest live value to the store immediately, cancelling
   * any frame-coalesced commit still pending. Called when a drag ends.
   */
  flushValues: () => void;
};

const selectors = {
  values: createSelector((state: State) =>
    state.valuesProp === undefined ? state.values : toSliderValueArray(state.valuesProp),
  ),
  valueByIndex: createSelector(
    (state: State) =>
      state.valuesProp === undefined ? state.values : toSliderValueArray(state.valuesProp),
    (values: readonly number[], index: number) => values[index],
  ),
  dragging: createSelector((state: State) => state.dragging),
  controlSize: createSelector((state: State) => state.controlSize),
  labelId: createSelector((state: State) => state.labelId),
};

/**
 * Assembles the `SliderRootState` a part publishes to its `style`/`className`/
 * `render` functions, reading the store's current snapshot. A part re-renders
 * through its own `useStoreState` subscriptions, so it reads this afresh on
 * every render it does have; fields whose selector it does not subscribe to
 * (e.g. a non-dragged thumb's `state.values`) reflect the latest snapshot at
 * that part's last render.
 */
export function getSliderRootState(store: SliderStore): SliderRootState {
  return {
    direction: store.context.direction,
    disabled: store.context.disabled,
    dragging: store.state.dragging,
    max: store.context.max,
    min: store.context.min,
    orientation: store.context.orientation,
    // `controlSize` and `step` complete the geometry a consumer needs to convert
    // a touch position itself — see `../sliderValue` and `Slider.Control`'s
    // `simultaneousGesture`. They are published rather than left in the store
    // because a worklet cannot reach the store.
    controlSize: store.state.controlSize,
    step: store.context.step,
    values: store.select('values'),
  };
}

/**
 * A store for the Slider's value and drag state.
 *
 * Diverges from Base UI, which has no slider store — the web version keeps the
 * value in a hook. zest's needs it because the parts must subscribe to *their*
 * slice of the state (a thumb re-renders when its own value changes, not when a
 * sibling's does), which a plain context cannot give them.
 */
export class SliderStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  /**
   * The synchronous truth during a drag. The store's `values` state is the
   * React-visible view, committed at most once per frame; the gesture logic
   * reads and writes this field directly so a burst of events coalesces into a
   * single frame rather than one render per event.
   */
  public liveValues: readonly number[];

  constructor(initialState?: Partial<State>, context?: Partial<Context>) {
    super(
      {
        values: [],
        valuesProp: undefined,
        dragging: false,
        controlSize: undefined,
        labelId: undefined,
        ...initialState,
      },
      {
        direction: 'ltr',
        disabled: false,
        format: undefined,
        getAccessibilityValueText: undefined,
        locale: undefined,
        max: 100,
        min: 0,
        minStepsBetweenValues: 0,
        orientation: 'horizontal',
        step: 1,
        thumbCollisionBehavior: 'push',
        isRange: false,
        onValueChange: undefined,
        onValueCommitted: undefined,
        markChanged: () => {},
        markTouched: () => {},
        setControlSize: () => {},
        setDragging: () => {},
        setLabelId: () => {},
        setThumbValue: () => 0,
        getValueFromPosition: () => undefined,
        getClosestThumbIndex: () => 0,
        commitValue: () => {},
        flushValues: () => {},
        ...context,
      },
      selectors,
    );
    this.liveValues = this.select('values');
  }

  // The pre-store `SliderRootContext` surface, preserved for custom controls
  // built against `useSliderRootContext`. The reactive fields are snapshots read
  // at access time; subscribe with `useStoreState` when you need to re-render.
  get values() {
    return this.select('values');
  }

  get min() {
    return this.context.min;
  }

  get max() {
    return this.context.max;
  }

  get step() {
    return this.context.step;
  }

  get disabled() {
    return this.context.disabled;
  }

  get orientation() {
    return this.context.orientation;
  }

  get dragging() {
    return this.state.dragging;
  }

  get format() {
    return this.context.format;
  }

  get locale() {
    return this.context.locale;
  }

  get controlSize() {
    return this.state.controlSize;
  }

  get direction() {
    return this.context.direction;
  }

  get getAccessibilityValueText() {
    return this.context.getAccessibilityValueText;
  }

  get labelId() {
    return this.state.labelId;
  }

  get setControlSize() {
    return this.context.setControlSize;
  }

  get setDragging() {
    return this.context.setDragging;
  }

  get setLabelId() {
    return this.context.setLabelId;
  }

  get setThumbValue() {
    return this.context.setThumbValue;
  }

  get getValueFromPosition() {
    return this.context.getValueFromPosition;
  }

  get getClosestThumbIndex() {
    return this.context.getClosestThumbIndex;
  }

  get commitValue() {
    return this.context.commitValue;
  }

  get flushValues() {
    return this.context.flushValues;
  }
}

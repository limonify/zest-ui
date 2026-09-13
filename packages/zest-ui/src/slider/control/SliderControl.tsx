'use client';
import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  type ComposedGesture,
  type SingleGesture,
} from 'react-native-gesture-handler';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useStoreState } from '../../store/ReactStore';
import { useRenderElement } from '../../use-render/useRenderElement';
import { getSliderRootState } from '../store/SliderStore';
import type { SliderRootState } from '../root/SliderRoot';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * The interactive area of the slider: it measures itself, owns the drag gesture,
 * and turns a touch position into a value.
 * Renders a `<View>` wrapped in a `GestureDetector`.
 *
 * Requires `react-native-gesture-handler`, and the app to be wrapped in
 * `<GestureHandlerRootView>`.
 */
export function SliderControl(componentProps: SliderControl.Props) {
  const { render, className, style, ref, simultaneousGesture, ...elementProps } = componentProps;

  const { testID } = elementProps;

  const store = useSliderRootContext();

  // The control publishes `state.dragging`, so it subscribes to it — and nothing
  // else. Its own visuals do not depend on the values, and a drag therefore does
  // not re-render the control once per frame.
  const dragging = useStoreState(store, 'dragging');

  const { disabled, orientation } = store.context;

  // The gesture runs outside React's render, so the thumb being dragged is kept
  // in a ref rather than state.
  const activeThumbRef = React.useRef(0);

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      store.context.setControlSize(orientation === 'vertical' ? height : width);
    },
    [orientation, store],
  );

  const moveTo = React.useCallback(
    (position: number, index: number) => {
      const value = store.context.getValueFromPosition(position);
      if (value === undefined) {
        return;
      }

      // With `thumbCollisionBehavior="swap"` the dragged thumb changes index the
      // moment it passes another, so the drag follows it there — otherwise the
      // finger would silently pick up the thumb it just went past.
      activeThumbRef.current = store.context.setThumbValue(
        index,
        value,
        createChangeEventDetails(REASONS.drag),
      );
    },
    [store],
  );

  const follow = React.useCallback(
    (event: { x: number; y: number }) => {
      moveTo(orientation === 'vertical' ? event.y : event.x, activeThumbRef.current);
    },
    [moveTo, orientation],
  );

  const gesture = usePanGesture({
    enabled: !disabled,
    // A gesture is invisible to the rendered tree, so `fireGestureHandler` can
    // only reach it through gesture-handler's own registry, which is keyed by
    // this id (and only populated under a test env). Forwarding the control's
    // `testID` is what makes the drag testable at all — without it consumers
    // could not test their own sliders either.
    testID: testID ?? 'slider-control',
    // The handlers touch React state, so they must not run on the UI thread.
    runOnJS: true,
    // A press anywhere on the control jumps the nearest thumb to it, then that
    // same thumb follows the finger.
    onBegin: (event) => {
      const position = orientation === 'vertical' ? event.y : event.x;
      const value = store.context.getValueFromPosition(position);
      if (value === undefined) {
        return;
      }

      activeThumbRef.current = store.context.getClosestThumbIndex(value);
      store.context.setDragging(true);
      moveTo(position, activeThumbRef.current);
    },
    // The move that activates the pan arrives as `onActivate`, and every move
    // after it as `onUpdate` — the thumb has to follow both.
    onActivate: follow,
    onUpdate: follow,
    onFinalize: () => {
      // The drag is over: drop any frame-coalesced commit and apply the latest
      // value right away, then let the value settle.
      store.context.flushValues();
      store.context.setDragging(false);
      store.context.commitValue(createChangeEventDetails(REASONS.drag));
    },
  });

  const state: SliderControlState = { ...getSliderRootState(store), dragging };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ onLayout: handleLayout }, elementProps],
  });

  // **The consumer's own gesture runs beside this one, not instead of it.**
  //
  // zest's handlers touch React state, so they are `.runOnJS(true)` — every move
  // crosses to JS, updates the store and re-renders before the thumb moves,
  // because the thumb's position comes out of `state.value`. That round trip
  // lands on every frame of a drag, which is the one place it is visible.
  //
  // zest cannot fix that itself without animating, which it does not do, or
  // taking reanimated as a dependency, which it will not. What it can do is let
  // a consumer attach a gesture of its OWN — one that stays on the UI thread and
  // moves the thumb from a shared value — and run the two simultaneously. The
  // arithmetic that consumer needs is exported from `../sliderValue` as
  // worklet-safe pure functions, so its conversion cannot drift from this one.
  //
  // Composed rather than having handlers added onto zest's own gesture:
  // `runOnJS` applies to the whole gesture, so a worklet added to this one would
  // be dragged onto the JS thread with the rest.
  //
  // The hook is called unconditionally, as hooks must be, but its result is only
  // used when there is something to compose with — wrapping a lone gesture is an
  // extra node for every slider that does not pass this prop.
  const composed = useSimultaneousGestures(gesture, ...(simultaneousGesture ? [simultaneousGesture] : []));

  return <GestureDetector gesture={simultaneousGesture ? composed : gesture}>{element}</GestureDetector>;
}

export interface SliderControlState extends SliderRootState {}

export interface SliderControlProps extends ZestUIComponentProps<typeof View, SliderControlState> {
  /**
   * A gesture of the consumer's own, run at the same time as the slider's.
   *
   * The slider's own drag handlers touch React state and therefore run on the JS
   * thread, so the thumb cannot move without a render — visible as a stutter on
   * a busy thread, once per frame of a drag. A consumer that wants the thumb to
   * follow the finger can build a `usePanGesture` whose handlers are worklets,
   * convert the touch with the worklet-safe helpers this module exports
   * (`sliderValueFromPosition`, `sliderPercentFromValue`), and drive the thumb
   * from a shared value — all on the UI thread.
   *
   * Both gestures receive the same touch. The slider keeps updating its value in
   * React exactly as before, so `onValueChange`, `state.value` and the rendered
   * thumb position are unchanged for everyone who does not pass this.
   *
   * **Takes a hook-API gesture, not the deprecated `Gesture.Pan()` builder.**
   * The two are different shapes and gesture-handler cannot compose across them,
   * so while zest's own gesture was a builder one this slot could not accept a
   * hook gesture — which pinned every consumer of this prop to an API
   * gesture-handler has deprecated, with no way out short of a cast that lies at
   * runtime.
   */
  simultaneousGesture?: SingleGesture | ComposedGesture;
}

export namespace SliderControl {
  export type State = SliderControlState;
  export type Props = SliderControlProps;
}

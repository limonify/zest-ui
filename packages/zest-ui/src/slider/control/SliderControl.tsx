'use client';
import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  const { render, className, style, ref, ...elementProps } = componentProps;

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

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        // A gesture is invisible to the rendered tree, so `fireGestureHandler`
        // can only reach it through gesture-handler's own registry, which is
        // keyed by this id (and only populated under a test env). Forwarding the
        // control's `testID` is what makes the drag testable at all — without it
        // consumers could not test their own sliders either.
        .withTestId(testID ?? 'slider-control')
        // A press anywhere on the control jumps the nearest thumb to it, then
        // that same thumb follows the finger.
        .onBegin((event) => {
          const position = orientation === 'vertical' ? event.y : event.x;
          const value = store.context.getValueFromPosition(position);
          if (value === undefined) {
            return;
          }

          activeThumbRef.current = store.context.getClosestThumbIndex(value);
          store.context.setDragging(true);
          moveTo(position, activeThumbRef.current);
        })
        // The move that activates the pan arrives as `onStart`, and every move
        // after it as `onUpdate` — the thumb has to follow both.
        .onStart(follow)
        .onUpdate(follow)
        .onFinalize(() => {
          // The drag is over: drop any frame-coalesced commit and apply the
          // latest value right away, then let the value settle.
          store.context.flushValues();
          store.context.setDragging(false);
          store.context.commitValue(createChangeEventDetails(REASONS.drag));
        })
        // The handlers touch React state, so they must not run on the UI thread.
        .runOnJS(true),
    [
      disabled,
      testID,
      orientation,
      follow,
      moveTo,
      store,
    ],
  );

  const state: SliderControlState = { ...getSliderRootState(store), dragging };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ onLayout: handleLayout }, elementProps],
  });

  return <GestureDetector gesture={gesture}>{element}</GestureDetector>;
}

export interface SliderControlState extends SliderRootState {}

export interface SliderControlProps
  extends ZestUIComponentProps<typeof View, SliderControlState> {}

export namespace SliderControl {
  export type State = SliderControlState;
  export type Props = SliderControlProps;
}

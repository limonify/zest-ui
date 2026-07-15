'use client';
import * as React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * An area where the user can drag to change the field value.
 * Renders a `<View>` wrapped in a `GestureDetector`.
 *
 * **Diverges from the web deliberately.** Upstream holds a pointer lock and reads
 * `movementX`/`movementY`, which lets the mouse scrub forever in place. A touch
 * cannot be locked and has no movement deltas, so this is an ordinary drag: the
 * value steps once for every `pixelSensitivity` pixels travelled. Upstream's
 * `teleportDistance` and the `ScrubAreaCursor` part go with the pointer lock —
 * both exist to manage a virtual cursor that a touch screen never shows.
 *
 * Requires `react-native-gesture-handler`, and the app to be wrapped in
 * `<GestureHandlerRootView>`.
 */
export function NumberFieldScrubArea(componentProps: NumberFieldScrubArea.Props) {
  const {
    render,
    className,
    direction = 'horizontal',
    pixelSensitivity = 2,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const { testID } = elementProps;
  const {
    getStepAmount,
    incrementValue,
    lastChangedValueRef,
    onValueCommitted,
    setScrubbing,
    state,
    valueRef,
  } = useNumberFieldRootContext();

  const { disabled, readOnly } = state;

  // How much of the drag has already been turned into steps. Kept in a ref
  // because the gesture runs outside React's render.
  const appliedRef = React.useRef(0);

  const scrub = useStableCallback((translationX: number, translationY: number) => {
    const travelled = direction === 'vertical' ? -translationY : translationX;
    // Only whole steps are applied, and the remainder stays pending so a slow
    // drag still accumulates instead of being rounded away every frame.
    const steps = Math.trunc(travelled / pixelSensitivity) - appliedRef.current;

    if (steps === 0) {
      return;
    }

    appliedRef.current += steps;
    incrementValue(getStepAmount() * Math.abs(steps), {
      direction: steps > 0 ? 1 : -1,
      reason: REASONS.scrub,
    });
  });

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled && !readOnly)
        // A gesture is invisible to the rendered tree, so tests can only reach it
        // through gesture-handler's registry, which is keyed by this id.
        .withTestId(testID ?? 'number-field-scrub-area')
        .onBegin(() => {
          appliedRef.current = 0;
          setScrubbing(true);
        })
        // The move that activates the pan arrives as `onStart`, and every move
        // after it as `onUpdate`.
        .onStart((event) => scrub(event.translationX, event.translationY))
        .onUpdate((event) => scrub(event.translationX, event.translationY))
        .onFinalize(() => {
          setScrubbing(false);
          onValueCommitted(
            lastChangedValueRef.current ?? valueRef.current,
            createChangeEventDetails(REASONS.scrub),
          );
        })
        // The handlers touch React state, so they must not run on the UI thread.
        .runOnJS(true),
    [
      disabled,
      readOnly,
      testID,
      scrub,
      setScrubbing,
      onValueCommitted,
      lastChangedValueRef,
      valueRef,
    ],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return <GestureDetector gesture={gesture}>{element}</GestureDetector>;
}

export interface NumberFieldScrubAreaState extends NumberFieldRootState {}

export interface NumberFieldScrubAreaProps
  extends BaseUIComponentProps<typeof View, NumberFieldScrubAreaState> {
  /**
   * The direction the drag is read along.
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical' | undefined;
  /**
   * How many pixels the drag must travel before the value steps once. A higher
   * value makes scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity?: number | undefined;
}

export namespace NumberFieldScrubArea {
  export type State = NumberFieldScrubAreaState;
  export type Props = NumberFieldScrubAreaProps;
}

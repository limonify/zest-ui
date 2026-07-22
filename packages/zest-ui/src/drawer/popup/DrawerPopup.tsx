'use client';
import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDialogPopupProps } from '../../dialog/popup/useDialogPopupProps';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { ZestUIComponentProps } from '../../types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useDrawerRootContext, type DrawerSnapPoint, type DrawerSwipeDirection } from '../root/DrawerRootContext';
import {
  closestSnapPointIndex,
  getSnapPointSwipeMovement,
  useDrawerSnapPoints,
} from '../root/useDrawerSnapPoints';

/**
 * Matches upstream's `DEFAULT_SWIPE_THRESHOLD`: a swipe dismisses once it has
 * travelled this far, regardless of how fast it was.
 */
const DEFAULT_SWIPE_THRESHOLD = 40;

/**
 * How far ahead a fling is projected when picking the next snap point, in
 * seconds of travel at the release velocity. This is what lets a fast flick skip
 * past a snap point, and what `snapToSequentialPoints` turns off.
 */
const VELOCITY_PROJECTION_SECONDS = 0.15;

/**
 * A container for the drawer contents, dismissable by swiping it away.
 * Renders a `<View>` wrapped in a `GestureDetector`.
 *
 * Follows the animation contract: the popup never moves itself. It publishes how
 * far the swipe has travelled as `swipeMovement` on the state object, and the
 * consumer turns that into a transform.
 *
 * Requires `react-native-gesture-handler`, and the app to be wrapped in
 * `<GestureHandlerRootView>`.
 */
export function DrawerPopup(componentProps: DrawerPopup.Props) {
  const {
    render,
    className,
    style,
    swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
    ref,
    ...elementProps
  } = componentProps;

  const { testID } = elementProps;
  const { swipeDirection, onPopupHeightChange } = useDrawerRootContext();
  const {
    activeSnapPoint,
    activeSnapPointOffset,
    hasSnapPoints,
    resolvedSnapPoints,
    setActiveSnapPoint,
    snapToSequentialPoints,
  } = useDrawerSnapPoints();
  const { store, open, transitionStatus, props } = useDialogPopupProps();

  const [swiping, setSwiping] = React.useState(false);
  const [swipeMovement, setSwipeMovement] = React.useState(0);

  // The gesture callbacks read the movement they just published, which React has
  // not re-rendered yet by the time the release arrives.
  const swipeMovementRef = React.useRef(0);

  const publishMovement = useStableCallback((movement: number) => {
    swipeMovementRef.current = movement;
    setSwipeMovement(movement);
  });

  const handleLayout = useStableCallback((event: LayoutChangeEvent) => {
    onPopupHeightChange(event.nativeEvent.layout.height);
  });

  const baseOffset = activeSnapPointOffset ?? 0;

  const move = useStableCallback((translationX: number, translationY: number) => {
    const displacement = getDisplacement(swipeDirection, translationX, translationY);

    if (!hasSnapPoints) {
      // Without snap points there is nowhere to drag back to, so movement never
      // goes negative: dragging past the resting place would tear the drawer off
      // the edge it is anchored to.
      publishMovement(Math.max(displacement, 0));
      return;
    }

    // With snap points the drawer can also be dragged open, so a negative
    // displacement is meaningful — it is only damped past the fully-open edge.
    publishMovement(getSnapPointSwipeMovement(baseOffset, displacement));
  });

  const release = useStableCallback(
    (translationX: number, translationY: number, velocityX: number, velocityY: number) => {
      const displacement = getDisplacement(swipeDirection, translationX, translationY);

      if (!hasSnapPoints) {
        if (displacement > swipeThreshold) {
          store.setOpen(false, createChangeEventDetails(REASONS.swipe));
        }
        return;
      }

      const velocity = getDisplacement(swipeDirection, velocityX, velocityY);
      // A fling is projected forward so it can skip past a snap point;
      // `snapToSequentialPoints` reduces the decision to drag distance alone.
      const projected = snapToSequentialPoints ? 0 : velocity * VELOCITY_PROJECTION_SECONDS;
      const targetOffset = baseOffset + swipeMovementRef.current + projected;

      const offsets = resolvedSnapPoints.map((point) => point.offset);
      const largestOffset = Math.max(...offsets);

      // Past the most-closed snap point by the dismiss threshold, the gesture
      // stops being a snap and becomes a dismissal.
      if (targetOffset > largestOffset + swipeThreshold) {
        store.setOpen(false, createChangeEventDetails(REASONS.swipe));
        return;
      }

      const nextIndex = closestSnapPointIndex(offsets, targetOffset);
      const next = resolvedSnapPoints[nextIndex];
      if (next) {
        setActiveSnapPoint(next.value, createChangeEventDetails(REASONS.swipe));
      }
    },
  );

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        // A gesture is invisible to the rendered tree, so tests can only reach it
        // through gesture-handler's registry, which is keyed by this id.
        .withTestId(testID ?? 'drawer-popup')
        .onBegin(() => {
          setSwiping(true);
        })
        // The move that activates the pan arrives as `onStart`, and every move
        // after it as `onUpdate` — the drawer has to follow both.
        .onStart((event) => move(event.translationX, event.translationY))
        .onUpdate((event) => move(event.translationX, event.translationY))
        .onEnd((event) =>
          release(event.translationX, event.translationY, event.velocityX, event.velocityY),
        )
        .onFinalize(() => {
          setSwiping(false);
          publishMovement(0);
        })
        // The handlers touch React state, so they must not run on the UI thread.
        .runOnJS(true),
    [testID, move, release, publishMovement],
  );

  const state: DrawerPopupState = {
    open,
    transitionStatus,
    swiping,
    swipeMovement,
    swipeDirection,
    snapPoint: activeSnapPoint ?? null,
    snapPointOffset: activeSnapPointOffset,
  };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ ...props, onLayout: handleLayout }, elementProps],
  });

  return <GestureDetector gesture={gesture}>{element}</GestureDetector>;
}

/** How far a translation has travelled towards `direction`. */
function getDisplacement(direction: DrawerSwipeDirection, x: number, y: number) {
  switch (direction) {
    case 'up':
      return -y;
    case 'down':
      return y;
    case 'left':
      return -x;
    default:
      return x;
  }
}

export interface DrawerPopupState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * The transition status of the drawer: `'starting'` as it opens (auto-clears
   * to `undefined` after one frame), `'ending'` once it is closing.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether a swipe is currently in progress.
   */
  swiping: boolean;
  /**
   * How far the current swipe has travelled towards `swipeDirection`, in pixels,
   * and `0` whenever no swipe is in progress. Without snap points this is never
   * negative; with them it goes negative as the drawer is dragged open.
   */
  swipeMovement: number;
  /**
   * The direction a swipe must travel to dismiss the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
  /**
   * The currently active snap point, or `null` when there are none.
   */
  snapPoint: DrawerSnapPoint | null;
  /**
   * How far the active snap point pushes the popup off the edge, in pixels, or
   * `null` when there are no snap points. Add `swipeMovement` to it to place the
   * popup mid-drag.
   */
  snapPointOffset: number | null;
}

export interface DrawerPopupProps extends ZestUIComponentProps<typeof View, DrawerPopupState> {
  /**
   * How far a swipe must travel, in pixels, before it dismisses the drawer. With
   * snap points, how far past the most-closed one a swipe must go to dismiss
   * rather than snap.
   * @default 40
   */
  swipeThreshold?: number | undefined;
}

export namespace DrawerPopup {
  export type State = DrawerPopupState;
  export type Props = DrawerPopupProps;
}

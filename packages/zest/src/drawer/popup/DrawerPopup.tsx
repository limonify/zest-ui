'use client';
import * as React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDialogPopupProps } from '../../dialog/popup/useDialogPopupProps';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useDrawerRootContext, type DrawerSwipeDirection } from '../root/DrawerRootContext';

/**
 * Matches upstream's `DEFAULT_SWIPE_THRESHOLD`: a swipe dismisses once it has
 * travelled this far, regardless of how fast it was.
 */
const DEFAULT_SWIPE_THRESHOLD = 40;

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
  const { swipeDirection } = useDrawerRootContext();
  const { store, open, props } = useDialogPopupProps();

  const [swiping, setSwiping] = React.useState(false);
  const [swipeMovement, setSwipeMovement] = React.useState(0);

  // The gesture callbacks read the movement they just published, which React has
  // not re-rendered yet by the time the release arrives.
  const swipeMovementRef = React.useRef(0);

  const publishMovement = React.useCallback((movement: number) => {
    swipeMovementRef.current = movement;
    setSwipeMovement(movement);
  }, []);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        // A gesture is invisible to the rendered tree, so tests can only reach it
        // through gesture-handler's registry, which is keyed by this id.
        .withTestId(testID ?? 'drawer-popup')
        .onBegin(() => {
          setSwiping(true);
        })
        .onUpdate((event) => {
          const displacement = getDisplacement(
            swipeDirection,
            event.translationX,
            event.translationY,
          );

          // Only movement along the dismiss direction counts, and it never goes
          // negative: dragging the drawer back past its resting place would
          // otherwise tear it off the edge it is anchored to.
          publishMovement(Math.max(displacement, 0));
        })
        .onEnd((event) => {
          const displacement = getDisplacement(
            swipeDirection,
            event.translationX,
            event.translationY,
          );

          if (displacement > swipeThreshold) {
            store.setOpen(false, createChangeEventDetails(REASONS.swipe));
          }
        })
        .onFinalize(() => {
          setSwiping(false);
          publishMovement(0);
        })
        // The handlers touch React state, so they must not run on the UI thread.
        .runOnJS(true),
    [testID, swipeDirection, swipeThreshold, store, publishMovement],
  );

  const state: DrawerPopupState = { open, swiping, swipeMovement, swipeDirection };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [props, elementProps],
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
   * Whether a swipe is currently in progress.
   */
  swiping: boolean;
  /**
   * How far the current swipe has travelled towards `swipeDirection`, in pixels,
   * and `0` whenever no swipe is in progress. Never negative.
   */
  swipeMovement: number;
  /**
   * The direction a swipe must travel to dismiss the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
}

export interface DrawerPopupProps extends BaseUIComponentProps<typeof View, DrawerPopupState> {
  /**
   * How far a swipe must travel, in pixels, before it dismisses the drawer.
   * @default 40
   */
  swipeThreshold?: number | undefined;
}

export namespace DrawerPopup {
  export type State = DrawerPopupState;
  export type Props = DrawerPopupProps;
}

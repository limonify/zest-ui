'use client';
import * as React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useDrawerRootContext, type DrawerSwipeDirection } from '../root/DrawerRootContext';

/**
 * How far a swipe must travel, in pixels, before it opens the drawer. Matches
 * upstream's `FALLBACK_SWIPE_OPEN_THRESHOLD` — upstream also scales this to half
 * the popup size, but the swipe area is measured before the popup ever mounts, so
 * a fixed pixel threshold is all React Native can offer here.
 */
const DEFAULT_SWIPE_OPEN_THRESHOLD = 40;

const oppositeSwipeDirection: Record<DrawerSwipeDirection, DrawerSwipeDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/**
 * An invisible area, usually pinned to a screen edge, that opens the drawer when
 * swiped. Renders a `<View>` wrapped in a `GestureDetector`.
 *
 * Its swipe direction defaults to the opposite of `Drawer.Root`'s
 * `swipeDirection`: a drawer dismissed by swiping `down` is opened by swiping
 * `up`. Place it where the drawer enters from (a bottom drawer's swipe area sits
 * at the bottom of the screen) and give it a size — it has none of its own.
 *
 * Requires `react-native-gesture-handler`, and the app to be wrapped in
 * `<GestureHandlerRootView>`.
 */
export function DrawerSwipeArea(componentProps: DrawerSwipeArea.Props) {
  const {
    render,
    className,
    style,
    disabled = false,
    swipeDirection: swipeDirectionProp,
    swipeThreshold = DEFAULT_SWIPE_OPEN_THRESHOLD,
    ref,
    ...elementProps
  } = componentProps;

  const { testID } = elementProps;
  const store = useDialogRootContext();
  const { swipeDirection: dismissDirection } = useDrawerRootContext();

  const open = store.useState('open');

  const [swiping, setSwiping] = React.useState(false);

  // The direction that *opens* the drawer is the opposite of the one that
  // dismisses it, unless the consumer overrides it.
  const openDirection = swipeDirectionProp ?? oppositeSwipeDirection[dismissDirection];

  const release = useStableCallback((translationX: number, translationY: number) => {
    if (disabled) {
      return;
    }

    const displacement = getDisplacement(openDirection, translationX, translationY);
    if (displacement > swipeThreshold) {
      store.setOpen(true, createChangeEventDetails(REASONS.swipe));
    }
  });

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        // A gesture is invisible to the rendered tree, so tests can only reach it
        // through gesture-handler's registry, which is keyed by this id.
        .withTestId(testID ?? 'drawer-swipe-area')
        .enabled(!disabled)
        .onBegin(() => {
          setSwiping(true);
        })
        .onEnd((event) => release(event.translationX, event.translationY))
        .onFinalize(() => {
          setSwiping(false);
        })
        // The handlers touch React state, so they must not run on the UI thread.
        .runOnJS(true),
    [testID, disabled, release],
  );

  const state: DrawerSwipeAreaState = {
    open,
    swiping,
    swipeDirection: openDirection,
    disabled,
  };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
        'aria-hidden': true,
      },
      elementProps,
    ],
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

export interface DrawerSwipeAreaState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * Whether a swipe is currently in progress.
   */
  swiping: boolean;
  /**
   * The swipe direction that opens the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
  /**
   * Whether the swipe area is disabled.
   */
  disabled: boolean;
}

export interface DrawerSwipeAreaProps
  extends ZestUIComponentProps<typeof View, DrawerSwipeAreaState> {
  /**
   * Whether the swipe area is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The swipe direction that opens the drawer. Defaults to the opposite of
   * `Drawer.Root`'s `swipeDirection`.
   */
  swipeDirection?: DrawerSwipeDirection | undefined;
  /**
   * How far a swipe must travel, in pixels, before it opens the drawer.
   * @default 40
   */
  swipeThreshold?: number | undefined;
}

export namespace DrawerSwipeArea {
  export type State = DrawerSwipeAreaState;
  export type Props = DrawerSwipeAreaProps;
}

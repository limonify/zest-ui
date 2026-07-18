'use client';
import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { ZestUIComponentProps } from '../../types';
import type { ToastObject } from '../useToastManager';
import { ToastRootContext } from './ToastRootContext';

/** Matches `Drawer.Popup`: a swipe dismisses once it has travelled this far. */
const DEFAULT_SWIPE_THRESHOLD = 40;

export type ToastSwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Groups all parts of an individual toast.
 * Renders a `<View>` wrapped in a `GestureDetector`.
 *
 * Follows the animation contract: it never moves itself. It publishes
 * `transitionStatus`, its stacking `offsetY`/`index`, and how far a swipe has
 * travelled, and the consumer turns those into a transform.
 *
 * Nothing in React Native reports that a closing animation finished, so a closed
 * toast would otherwise sit in the list forever. `removeOnClose` (on by default)
 * drops it the moment it closes, which is what a consumer who does not animate
 * wants. To animate the exit, set `removeOnClose={false}`, drive the exit from
 * `state.transitionStatus === 'ending'`, and call `useToastManager().remove(id)`
 * when it finishes. This is the same lever as `Collapsible.Panel`'s `keepMounted`.
 */
export function ToastRoot(componentProps: ToastRoot.Props) {
  const {
    render,
    className,
    style,
    toast,
    removeOnClose = true,
    swipeDirection = 'right',
    swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
    ref,
    ...elementProps
  } = componentProps;

  const { testID } = elementProps;
  const store = useToastProviderContext();

  const [titleId, setTitleId] = React.useState<string | undefined>(undefined);
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>(undefined);
  const [swiping, setSwiping] = React.useState(false);
  const [swipeMovement, setSwipeMovement] = React.useState(0);

  const index = store.useState('toastIndex', toast.id);
  const offsetY = store.useState('toastOffsetY', toast.id);
  const visibleIndex = store.useState('toastVisibleIndex', toast.id);
  const expanded = store.useState('expanded');

  // Without an animation there is nothing to wait for, so a closed toast leaves
  // the list at once.
  useIsoLayoutEffect(() => {
    if (removeOnClose && toast.transitionStatus === 'ending') {
      store.removeToast(toast.id);
    }
  }, [removeOnClose, toast.transitionStatus, toast.id, store]);

  const handleLayout = useStableCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;

    // A closing toast reports a height of 0 through the store; measuring it again
    // here would undo that and leave a gap in the stack.
    if (toast.transitionStatus !== 'ending' && height !== toast.height) {
      store.updateToastInternal(toast.id, { height });
    }
  });

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        // A gesture is invisible to the rendered tree, so tests can only reach it
        // through gesture-handler's registry, which is keyed by this id.
        .withTestId(testID ?? `toast-${toast.id}`)
        .onBegin(() => {
          setSwiping(true);
          // A finger on the toast means "not yet" — the same intent hover
          // carries on the web, where upstream pairs these two exactly like this.
          // Setting `pressed` alone would only re-render; the timers keep running
          // until they are told to stop.
          store.set('pressed', true);
          store.pauseTimers();
        })
        .onStart((event) => setSwipeMovement(getDisplacement(swipeDirection, event)))
        .onUpdate((event) => setSwipeMovement(getDisplacement(swipeDirection, event)))
        .onEnd((event) => {
          if (getDisplacement(swipeDirection, event) > swipeThreshold) {
            store.closeToast(toast.id);
          }
        })
        .onFinalize(() => {
          setSwiping(false);
          setSwipeMovement(0);
          store.set('pressed', false);

          // `expandedOrInactive`, not `expanded`: letting go while the app is in
          // the background must not restart the countdown, or the toast spends it
          // where nobody can see it. Upstream guards the same way, on the window
          // being focused.
          if (!store.select('expandedOrInactive')) {
            store.resumeTimers();
          }
        })
        // The handlers touch React state, so they must not run on the UI thread.
        .runOnJS(true),
    [testID, toast.id, swipeDirection, swipeThreshold, store],
  );

  const state: ToastRootState = React.useMemo(
    () => ({
      transitionStatus: toast.transitionStatus,
      expanded,
      limited: toast.limited ?? false,
      type: toast.type,
      index,
      visibleIndex,
      offsetY,
      height: toast.height ?? 0,
      swiping,
      swipeMovement,
      swipeDirection,
    }),
    [
      toast.transitionStatus,
      expanded,
      toast.limited,
      toast.type,
      index,
      visibleIndex,
      offsetY,
      toast.height,
      swiping,
      swipeMovement,
      swipeDirection,
    ],
  );

  const contextValue: ToastRootContext = React.useMemo(
    () => ({ toast, state, titleId, setTitleId, descriptionId, setDescriptionId }),
    [toast, state, titleId, descriptionId],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout: handleLayout,
        accessibilityRole: 'alert' as const,
        accessibilityLiveRegion: (toast.priority === 'high' ? 'assertive' : 'polite') as
          | 'assertive'
          | 'polite',
        accessibilityLabelledBy: titleId,
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
      },
      elementProps,
    ],
  });

  return (
    <ToastRootContext.Provider value={contextValue}>
      <GestureDetector gesture={gesture}>{element}</GestureDetector>
    </ToastRootContext.Provider>
  );
}

/** How far a translation has travelled towards `direction`. */
function getDisplacement(
  direction: ToastSwipeDirection,
  event: { translationX: number; translationY: number },
) {
  switch (direction) {
    case 'up':
      return -event.translationY;
    case 'down':
      return event.translationY;
    case 'left':
      return -event.translationX;
    default:
      return event.translationX;
  }
}

export interface ToastRootState {
  /**
   * The toast's transition status: `'starting'` as it arrives, `'ending'` once it
   * is closing.
   */
  transitionStatus: 'starting' | 'ending' | undefined;
  /**
   * Whether a toast is being pressed or focused, which pauses the timers.
   */
  expanded: boolean;
  /**
   * Whether the toast is beyond the provider's `limit`. Limited toasts stay in
   * the list so they can be hidden or animated out rather than vanishing.
   */
  limited: boolean;
  /**
   * The toast's type, as passed to `add()`.
   */
  type: string | undefined;
  /**
   * The toast's index in the list, newest first.
   */
  index: number;
  /**
   * The toast's index among the toasts that are not closing, or `-1` when it is.
   */
  visibleIndex: number;
  /**
   * How far down the stack the toast sits, in pixels: the total height of every
   * toast before it. This is the RN counterpart of upstream's
   * `--toast-offset-y` CSS variable.
   */
  offsetY: number;
  /**
   * The toast's measured height.
   */
  height: number;
  /**
   * Whether a swipe is currently in progress.
   */
  swiping: boolean;
  /**
   * How far the current swipe has travelled towards `swipeDirection`, in pixels.
   */
  swipeMovement: number;
  /**
   * The direction a swipe must travel to dismiss the toast.
   */
  swipeDirection: ToastSwipeDirection;
}

export interface ToastRootProps extends ZestUIComponentProps<typeof View, ToastRootState> {
  /**
   * The toast to render, from `useToastManager().toasts`.
   */
  toast: ToastObject<any>;
  /**
   * Whether to remove the toast from the list as soon as it closes.
   *
   * Set it to `false` to animate the exit: drive the animation from
   * `state.transitionStatus === 'ending'` and call `useToastManager().remove(id)`
   * when it finishes. Nothing in React Native can report that for you.
   * @default true
   */
  removeOnClose?: boolean | undefined;
  /**
   * The swipe direction used to dismiss the toast.
   * @default 'right'
   */
  swipeDirection?: ToastSwipeDirection | undefined;
  /**
   * How far a swipe must travel, in pixels, before it dismisses the toast.
   * @default 40
   */
  swipeThreshold?: number | undefined;
}

export namespace ToastRoot {
  export type State = ToastRootState;
  export type Props = ToastRootProps;
  export type SwipeDirection = ToastSwipeDirection;
}

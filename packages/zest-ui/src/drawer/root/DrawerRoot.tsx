'use client';
import * as React from 'react';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { useRenderDialogRoot } from '../../dialog/root/useRenderDialogRoot';
import type { DrawerHandle } from '../handle';
import { useControlled } from '../../hooks/useControlled';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import {
  DrawerRootContext,
  type DrawerSnapPoint,
  type DrawerSwipeDirection,
} from './DrawerRootContext';

/**
 * Groups all parts of the drawer.
 * Doesn't render its own element.
 *
 * A drawer is a dialog that can also be dismissed by swiping it away, so it
 * reuses the dialog store and every dialog part but its own `Drawer.Popup`.
 *
 * **Not ported from upstream.** `modal` (a React Native `Modal` is always modal,
 * and there is no page behind it to scroll-lock) and `onOpenChangeComplete` (see
 * the animation contract in CLAUDE.md — nothing in RN reports that a closing
 * animation finished).
 * Upstream's `Indent`/`IndentBackground` parts have no counterpart either: they
 * scale the page behind the drawer, which a `Modal` renders in a separate native
 * window from.
 */
export function DrawerRoot<Payload = unknown>(props: DrawerRoot.Props<Payload>) {
  const {
    swipeDirection = 'down',
    snapPoints,
    snapPoint,
    defaultSnapPoint,
    onSnapPointChange,
    snapToSequentialPoints = false,
    ...dialogProps
  } = props;

  const [popupHeight, setPopupHeight] = React.useState(0);

  const [activeSnapPoint, setActiveSnapPointState] = useControlled<DrawerSnapPoint | null>({
    controlled: snapPoint,
    default: defaultSnapPoint ?? snapPoints?.[0] ?? null,
    name: 'Drawer',
    state: 'snapPoint',
  });

  const setActiveSnapPoint = useStableCallback(
    (nextSnapPoint: DrawerSnapPoint | null, eventDetails: DrawerRoot.SnapPointChangeEventDetails) => {
      if (nextSnapPoint === activeSnapPoint) {
        return;
      }

      onSnapPointChange?.(nextSnapPoint, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setActiveSnapPointState(nextSnapPoint);
    },
  );

  const onPopupHeightChange = useStableCallback((height: number) => {
    setPopupHeight(height);
  });

  const contextValue: DrawerRootContext = React.useMemo(
    () => ({
      swipeDirection,
      snapPoints,
      snapToSequentialPoints,
      activeSnapPoint,
      setActiveSnapPoint,
      popupHeight,
      onPopupHeightChange,
    }),
    [
      swipeDirection,
      snapPoints,
      snapToSequentialPoints,
      activeSnapPoint,
      setActiveSnapPoint,
      popupHeight,
      onPopupHeightChange,
    ],
  );

  const dialogRoot = useRenderDialogRoot(dialogProps, 'dialog');

  return (
    <DrawerRootContext.Provider value={contextValue}>{dialogRoot}</DrawerRootContext.Provider>
  );
}

export interface DrawerRootState {}

export interface DrawerRootProps<Payload = unknown> {
  /**
   * Whether the drawer is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the drawer is initially open.
   *
   * To render a controlled drawer, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the drawer is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: DrawerRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether to prevent the drawer from closing on presses outside the popup.
   * Swipe dismissal is unaffected.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * The swipe direction used to dismiss the drawer.
   * @default 'down'
   */
  swipeDirection?: DrawerSwipeDirection | undefined;
  /**
   * Snap points used to position the drawer. A number `<= 1` is a fraction of
   * the viewport height, anything larger is a pixel value.
   *
   * A snap point describes how much of the drawer is *visible*, so snap points
   * are vertical by nature and only apply to `swipeDirection: 'down'`.
   */
  snapPoints?: readonly DrawerSnapPoint[] | undefined;
  /**
   * The currently active snap point. Use with `onSnapPointChange` to control it.
   */
  snapPoint?: DrawerSnapPoint | null | undefined;
  /**
   * The initial snap point when uncontrolled. Defaults to the first of
   * `snapPoints`.
   */
  defaultSnapPoint?: DrawerSnapPoint | null | undefined;
  /**
   * Event handler called when the active snap point changes.
   */
  onSnapPointChange?:
    | ((
        snapPoint: DrawerSnapPoint | null,
        eventDetails: DrawerRoot.SnapPointChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Disables velocity-based snap skipping, so drag distance alone determines the
   * next snap point.
   * @default false
   */
  snapToSequentialPoints?: boolean | undefined;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<DialogRoot.Actions | null> | undefined;
  /**
   * A handle associating this drawer with triggers rendered outside it, and
   * letting it be opened and closed imperatively. Create one with
   * `Drawer.createHandle()`.
   */
  handle?: DrawerHandle<Payload> | undefined;
  /**
   * The id of the trigger the drawer is associated with.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the trigger the drawer is initially associated with.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the drawer.
   *
   * Pass a function to receive the payload the drawer was opened with.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export type DrawerRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.swipe
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type DrawerRootChangeEventDetails = ZestChangeEventDetails<DrawerRootChangeEventReason>;

export type DrawerRootSnapPointChangeEventReason = DrawerRootChangeEventReason;

export type DrawerRootSnapPointChangeEventDetails =
  ZestChangeEventDetails<DrawerRootSnapPointChangeEventReason>;

export namespace DrawerRoot {
  export type State = DrawerRootState;
  export type Props<Payload = unknown> = DrawerRootProps<Payload>;
  export type Actions = DialogRoot.Actions;
  export type ChangeEventReason = DrawerRootChangeEventReason;
  export type ChangeEventDetails = DrawerRootChangeEventDetails;
  export type SnapPointChangeEventReason = DrawerRootSnapPointChangeEventReason;
  export type SnapPointChangeEventDetails = DrawerRootSnapPointChangeEventDetails;
  export type SwipeDirection = DrawerSwipeDirection;
  export type SnapPoint = DrawerSnapPoint;
}

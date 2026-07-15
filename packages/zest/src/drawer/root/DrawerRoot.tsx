'use client';
import * as React from 'react';
import { useRenderDialogRoot } from '../../dialog/root/useRenderDialogRoot';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { DrawerRootContext, type DrawerSwipeDirection } from './DrawerRootContext';

/**
 * Groups all parts of the drawer.
 * Doesn't render its own element.
 *
 * A drawer is a dialog that can also be dismissed by swiping it away, so it
 * reuses the dialog store and every dialog part but its own `Drawer.Popup`.
 *
 * **Not ported from upstream.** `modal` (a React Native `Modal` is always modal,
 * and there is no page behind it to scroll-lock), `onOpenChangeComplete` (see the
 * animation contract in CLAUDE.md — nothing in RN reports that a closing
 * animation finished), `actionsRef`/`handle`/`triggerId` (detached triggers and
 * payloads, still unported for `Dialog` too), and the snap point family
 * (`snapPoints`, `snapPoint`, `onSnapPointChange`, `snapToSequentialPoints`).
 * Upstream's `Indent`/`IndentBackground` parts have no counterpart either: they
 * scale the page behind the drawer, which a `Modal` renders in a separate native
 * window from.
 */
export function DrawerRoot(props: DrawerRoot.Props) {
  const { swipeDirection = 'down', ...dialogProps } = props;

  const contextValue: DrawerRootContext = React.useMemo(
    () => ({ swipeDirection }),
    [swipeDirection],
  );

  const dialogRoot = useRenderDialogRoot(dialogProps, 'dialog');

  return (
    <DrawerRootContext.Provider value={contextValue}>{dialogRoot}</DrawerRootContext.Provider>
  );
}

export interface DrawerRootState {}

export interface DrawerRootProps {
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
   * The content of the drawer.
   */
  children?: React.ReactNode;
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

export namespace DrawerRoot {
  export type State = DrawerRootState;
  export type Props = DrawerRootProps;
  export type ChangeEventReason = DrawerRootChangeEventReason;
  export type ChangeEventDetails = DrawerRootChangeEventDetails;
  export type SwipeDirection = DrawerSwipeDirection;
}

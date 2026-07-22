'use client';
import { View } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverTransitionContext } from '../root/PopoverTransitionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the popover contents.
 * Renders a `<View>`.
 */
export function PopoverPopup(componentProps: PopoverPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = usePopoverRootContext();
  const { side, align } = usePopoverPositionerContext();
  const { transitionStatus } = usePopoverTransitionContext() ?? { transitionStatus: undefined };

  const open = store.useState('open');
  const titleElementId = store.useState('titleElementId');
  const descriptionElementId = store.useState('descriptionElementId');

  const state: PopoverPopupState = { open, transitionStatus, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        role: 'dialog' as const,
        accessibilityLabelledBy: titleElementId,
        'aria-labelledby': titleElementId,
        'aria-describedby': descriptionElementId,
        // Claim the touch responder so presses inside the popup never reach the
        // backdrop's outside-press handler.
        onStartShouldSetResponder: () => true,
      },
      elementProps,
    ],
  });
}

export interface PopoverPopupState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * The transition status of the popover: `'starting'` as it opens (auto-clears
   * to `undefined` after one frame), `'ending'` once it is closing.
   */
  transitionStatus: TransitionStatus;
  /**
   * The side the popup was actually placed on, after collision handling.
   */
  side: Side;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
}

export interface PopoverPopupProps extends ZestUIComponentProps<typeof View, PopoverPopupState> {}

export namespace PopoverPopup {
  export type State = PopoverPopupState;
  export type Props = PopoverPopupProps;
}

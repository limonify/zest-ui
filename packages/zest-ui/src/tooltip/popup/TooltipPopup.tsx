'use client';
import { View } from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { useTooltipTransitionContext } from '../root/TooltipTransitionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the tooltip contents.
 * Renders a `<View>`.
 */
export function TooltipPopup(componentProps: TooltipPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useTooltipRootContext();
  const { side, align } = useTooltipPositionerContext();
  const { transitionStatus } = useTooltipTransitionContext() ?? { transitionStatus: undefined };

  const open = store.useState('open');

  const state: TooltipPopupState = { open, transitionStatus, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        role: 'tooltip' as const,
        accessibilityRole: 'tooltip' as const,
        // Claim the touch responder so presses inside the popup don't reach the
        // portal's dismissal surface.
        onStartShouldSetResponder: () => true,
      },
      elementProps,
    ],
  });
}

export interface TooltipPopupState {
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
  /**
   * The transition status of the tooltip: `'starting'` as it opens (auto-clears
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

export interface TooltipPopupProps extends ZestUIComponentProps<typeof View, TooltipPopupState> {}

export namespace TooltipPopup {
  export type State = TooltipPopupState;
  export type Props = TooltipPopupProps;
}

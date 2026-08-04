'use client';
import { View } from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { useTooltipTransitionContext } from '../root/TooltipTransitionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A container for the tooltip contents.
 * Renders a `<View>`.
 */
export function TooltipPopup(componentProps: TooltipPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useTooltipRootContext();
  const { side, align } = useTooltipPositionerContext();
  const { transitionStatus } = useTooltipTransitionContext() ?? { transitionStatus: undefined };

  const open = useStoreState(store, 'open');
  const triggerWidth = useStoreState(store, 'triggerWidth');
  const triggerHeight = useStoreState(store, 'triggerHeight');

  const state: TooltipPopupState = {
    open,
    transitionStatus,
    side,
    align,
    triggerWidth,
    triggerHeight,
  };

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
  /**
   * The trigger's measured width, available for consumers to size the popup
   * against its anchor. This is the React Native equivalent of the web's
   * `--anchor-width` CSS variable.
   */
  triggerWidth: number | undefined;
  /**
   * The trigger's measured height.
   */
  triggerHeight: number | undefined;
}

export interface TooltipPopupProps extends ZestUIComponentProps<typeof View, TooltipPopupState> {}

export namespace TooltipPopup {
  export type State = TooltipPopupState;
  export type Props = TooltipPopupProps;
}

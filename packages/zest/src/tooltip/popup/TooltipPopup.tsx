'use client';
import { View } from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../types';

/**
 * A container for the tooltip contents.
 * Renders a `<View>`.
 */
export function TooltipPopup(componentProps: TooltipPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useTooltipRootContext();
  const { side, align } = useTooltipPositionerContext();

  const open = store.useState('open');

  const state: TooltipPopupState = { open, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        role: 'tooltip' as const,
        // Claim the touch responder so presses inside the popup don't reach the
        // portal's dismissal surface.
        onStartShouldSetResponder: () => true,
      },
      elementProps,
    ],
  });
}

export interface TooltipPopupState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface TooltipPopupProps extends BaseUIComponentProps<typeof View, TooltipPopupState> {}

export namespace TooltipPopup {
  export type State = TooltipPopupState;
  export type Props = TooltipPopupProps;
}

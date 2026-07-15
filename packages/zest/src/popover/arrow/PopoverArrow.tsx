'use client';
import { View } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../types';

/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<View>`.
 *
 * The arrow is positioned for you; its shape and size are yours. `state.side`
 * tells you which edge of the popup it sits on.
 */
export function PopoverArrow(componentProps: PopoverArrow.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = usePopoverRootContext();
  const { side, align, arrowRef, arrowStyles } = usePopoverPositionerContext();

  const open = store.useState('open');

  const mergedRef = useMergedRefs(ref, arrowRef as React.Ref<unknown>);

  const state: PopoverArrowState = { open, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [{ style: { position: 'absolute' as const, ...arrowStyles } }, elementProps],
  });
}

export interface PopoverArrowState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * The side the popup was actually placed on, after collision handling.
   */
  side: Side;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
}

export interface PopoverArrowProps extends BaseUIComponentProps<typeof View, PopoverArrowState> {}

export namespace PopoverArrow {
  export type State = PopoverArrowState;
  export type Props = PopoverArrowProps;
}

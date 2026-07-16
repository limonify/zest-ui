'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../types';

/**
 * Displays an element positioned against the select popup anchor.
 * Renders a `<View>`.
 *
 * The arrow is positioned for you; its shape and size are yours. `state.side`
 * tells you which edge of the popup it sits on.
 */
export function SelectArrow(componentProps: SelectArrow.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const { side, align, arrowRef, arrowStyles } = useSelectPositionerContext();

  const open = store.useState('open');

  const mergedRef = useMergedRefs(ref, arrowRef as React.Ref<unknown>);

  const state: SelectArrowState = { open, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [
      { style: { position: 'absolute' as const, ...arrowStyles }, 'aria-hidden': true },
      elementProps,
    ],
  });
}

export interface SelectArrowState {
  /**
   * Whether the select popup is currently open.
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

export interface SelectArrowProps extends BaseUIComponentProps<typeof View, SelectArrowState> {}

export namespace SelectArrow {
  export type State = SelectArrowState;
  export type Props = SelectArrowProps;
}

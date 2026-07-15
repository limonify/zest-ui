'use client';
import type * as React from 'react';
import { View } from 'react-native';
import { useToastPositionerContext } from '../positioner/ToastPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../types';

/**
 * Displays an element pointing at the anchor an anchored toast belongs to.
 * Renders a `<View>`.
 */
export function ToastArrow(componentProps: ToastArrow.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { side, align, arrowRef, arrowStyles } = useToastPositionerContext();

  const mergedRef = useMergedRefs(ref, arrowRef as React.Ref<unknown>);

  const state: ToastArrowState = { side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [{ style: { position: 'absolute' as const, ...arrowStyles } }, elementProps],
  });
}

export interface ToastArrowState {
  side: Side;
  align: Align;
}

export interface ToastArrowProps extends BaseUIComponentProps<typeof View, ToastArrowState> {}

export namespace ToastArrow {
  export type State = ToastArrowState;
  export type Props = ToastArrowProps;
}

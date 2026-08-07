'use client';
import type * as React from 'react';
import { View } from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Displays an element positioned against the tooltip anchor.
 * Renders a `<View>`.
 */
export function TooltipArrow(componentProps: TooltipArrow.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useTooltipRootContext();
  const { side, align, arrowRef, arrowStyles, onArrowLayout } = useTooltipPositionerContext();

  const open = useStoreState(store, 'open');

  const mergedRef = useMergedRefs(ref, arrowRef as React.Ref<unknown>);

  const state: TooltipArrowState = { open, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [
      { onLayout: onArrowLayout, style: { position: 'absolute' as const, ...arrowStyles } },
      elementProps,
    ],
  });
}

export interface TooltipArrowState {
  open: boolean;
  side: PhysicalSide;
  align: Align;
}

export interface TooltipArrowProps extends ZestUIComponentProps<typeof View, TooltipArrowState> {}

export namespace TooltipArrow {
  export type State = TooltipArrowState;
  export type Props = TooltipArrowProps;
}

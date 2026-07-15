'use client';
import type * as React from 'react';
import { View } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../types';

/**
 * Displays an element positioned against the menu anchor.
 * Renders a `<View>`.
 */
export function MenuArrow(componentProps: MenuArrow.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useMenuRootContext();
  const { side, align, arrowRef, arrowStyles } = useMenuPositionerContext();

  const open = store.useState('open');

  const mergedRef = useMergedRefs(ref, arrowRef as React.Ref<unknown>);

  const state: MenuArrowState = { open, side, align };

  return useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [{ style: { position: 'absolute' as const, ...arrowStyles } }, elementProps],
  });
}

export interface MenuArrowState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface MenuArrowProps extends BaseUIComponentProps<typeof View, MenuArrowState> {}

export namespace MenuArrow {
  export type State = MenuArrowState;
  export type Props = MenuArrowProps;
}

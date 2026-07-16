'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useMenuPortalContext } from '../../menu/portal/MenuPortalContext';
import { MenuPositionerContext } from '../../menu/positioner/MenuPositionerContext';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';

const NO_ARROW = { current: null };

/**
 * Positions the context menu popup at the point the long press landed.
 * Renders a `<View>`.
 *
 * Unlike `Menu.Positioner`, it anchors to a screen point rather than a trigger
 * element, so there is no collision-aware floating-ui pass — the popup is placed
 * directly at the press coordinates.
 */
export function ContextMenuPositioner(componentProps: ContextMenuPositioner.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  useMenuPortalContext();
  const store = useMenuRootContext();
  const { anchor } = useContextMenuRootContext();

  const open = store.useState('open');

  const state: ContextMenuPositionerState = { open, side: 'bottom', align: 'start' };

  const contextValue: MenuPositionerContext = React.useMemo(
    () => ({ side: 'bottom', align: 'start', arrowRef: NO_ARROW, arrowStyles: {} }),
    [],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      { style: { position: 'absolute' as const, left: anchor.x, top: anchor.y } },
      elementProps,
    ],
  });

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      {element}
    </MenuPositionerContext.Provider>
  );
}

export interface ContextMenuPositionerState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface ContextMenuPositionerProps
  extends ZestUIComponentProps<typeof View, ContextMenuPositionerState> {}

export namespace ContextMenuPositioner {
  export type State = ContextMenuPositionerState;
  export type Props = ContextMenuPositionerProps;
}

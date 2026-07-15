'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPortalContext } from '../portal/MenuPortalContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import {
  useAnchorPositioning,
  type Align,
  type Side,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../types';
import { MenuPositionerContext } from './MenuPositionerContext';

/**
 * Positions the menu against the trigger.
 * Renders a `<View>`.
 */
export function MenuPositioner(componentProps: MenuPositioner.Props) {
  const {
    align = 'start',
    alignOffset = 0,
    arrowPadding = 5,
    className,
    collisionPadding = 5,
    render,
    side = 'bottom',
    sideOffset = 0,
    sticky = false,
    style,
    ref,
    ...elementProps
  } = componentProps;

  useMenuPortalContext();
  const store = useMenuRootContext();
  const open = store.useState('open');
  const triggerNode = store.useState('triggerNode');

  const positioning = useAnchorPositioning({
    align,
    alignOffset,
    arrowPadding,
    collisionPadding,
    side,
    sideOffset,
    sticky,
  });

  const { arrowRef, arrowStyles, positionerStyles, refs, update } = positioning;

  useIsoLayoutEffect(() => {
    refs.setReference(triggerNode ?? null);
  }, [refs, triggerNode]);

  useIsoLayoutEffect(() => {
    store.set('update', update);
    return () => {
      store.set('update', undefined);
    };
  }, [store, update]);

  const mergedRef = useMergedRefs(ref, refs.setFloating);

  const state: MenuPositionerState = { open, side: positioning.side, align: positioning.align };

  const contextValue: MenuPositionerContext = React.useMemo(
    () => ({ side: positioning.side, align: positioning.align, arrowRef, arrowStyles }),
    [positioning.side, positioning.align, arrowRef, arrowStyles],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        style: positionerStyles,
        onLayout() {
          update();
        },
      },
      elementProps,
    ],
  });

  return (
    <MenuPositionerContext.Provider value={contextValue}>{element}</MenuPositionerContext.Provider>
  );
}

export interface MenuPositionerState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface MenuPositionerProps
  extends UseAnchorPositioningSharedParameters,
    BaseUIComponentProps<typeof View, MenuPositionerState> {}

export namespace MenuPositioner {
  export type State = MenuPositionerState;
  export type Props = MenuPositionerProps;
}

'use client';
import * as React from 'react';
import { View } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPortalContext } from '../portal/PopoverPortalContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import {
  useAnchorPositioning,
  type Align,
  type Side,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';
import { PopoverPositionerContext } from './PopoverPositionerContext';

/**
 * Positions the popover against the trigger.
 * Renders a `<View>`.
 */
export function PopoverPositioner(componentProps: PopoverPositioner.Props) {
  const {
    align = 'center',
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

  usePopoverPortalContext();
  const store = usePopoverRootContext();
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

  // The anchor is measured from the trigger, which lives outside the portal.
  useIsoLayoutEffect(() => {
    refs.setReference(triggerNode ?? null);
  }, [refs, triggerNode]);

  // Nothing observes layout globally, so the trigger asks for a reposition
  // through the store when it moves.
  useIsoLayoutEffect(() => {
    store.set('update', update);
    return () => {
      store.set('update', undefined);
    };
  }, [store, update]);

  const mergedRef = useMergedRefs(ref, refs.setFloating);

  const state: PopoverPositionerState = {
    open,
    side: positioning.side,
    align: positioning.align,
  };

  const contextValue: PopoverPositionerContext = React.useMemo(
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
          // The popup's own size feeds flip/shift, so recompute once it is laid out.
          update();
        },
      },
      elementProps,
    ],
  });

  return (
    <PopoverPositionerContext.Provider value={contextValue}>
      {element}
    </PopoverPositionerContext.Provider>
  );
}

export interface PopoverPositionerState {
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

export interface PopoverPositionerProps
  extends UseAnchorPositioningSharedParameters,
    ZestUIComponentProps<typeof View, PopoverPositionerState> {}

export namespace PopoverPositioner {
  export type State = PopoverPositionerState;
  export type Props = PopoverPositionerProps;
}

'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPortalContext } from '../portal/TooltipPortalContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import {
  useAnchorPositioning,
  type Align,
  type PhysicalSide,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';
import { TooltipPositionerContext } from './TooltipPositionerContext';
import { useStoreState } from '../../store/ReactStore';

/**
 * Positions the tooltip against the trigger.
 * Renders a `<View>`.
 */
export function TooltipPositioner(componentProps: TooltipPositioner.Props) {
  const {
    align = 'center',
    alignOffset = 0,
    arrowPadding = 5,
    className,
    collisionPadding = 5,
    render,
    side = 'top',
    sideOffset = 0,
    sticky = false,
    style,
    ref,
    ...elementProps
  } = componentProps;

  useTooltipPortalContext();
  const store = useTooltipRootContext();
  const open = useStoreState(store, 'open');
  const triggerWidth = useStoreState(store, 'triggerWidth');
  const triggerHeight = useStoreState(store, 'triggerHeight');
  const triggerNode = useStoreState(store, 'triggerNode');

  const positioning = useAnchorPositioning({
    align,
    open,
    alignOffset,
    arrowPadding,
    collisionPadding,
    side,
    sideOffset,
    sticky,
  });

  const { arrowRef, arrowStyles, onArrowLayout, positionerStyles, refs, update } = positioning;

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

  const state: TooltipPositionerState = {
    open,
    side: positioning.side,
    align: positioning.align,
    triggerWidth,
    triggerHeight,
  };

  const contextValue: TooltipPositionerContext = React.useMemo(
    () => ({
      side: positioning.side,
      align: positioning.align,
      arrowRef,
      arrowStyles,
      onArrowLayout,
    }),
    [positioning.side, positioning.align, arrowRef, arrowStyles, onArrowLayout],
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
    <TooltipPositionerContext.Provider value={contextValue}>
      {element}
    </TooltipPositionerContext.Provider>
  );
}

export interface TooltipPositionerState {
  open: boolean;
  side: PhysicalSide;
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

export interface TooltipPositionerProps
  extends UseAnchorPositioningSharedParameters,
    ZestUIComponentProps<typeof View, TooltipPositionerState> {}

export namespace TooltipPositioner {
  export type State = TooltipPositionerState;
  export type Props = TooltipPositionerProps;
}

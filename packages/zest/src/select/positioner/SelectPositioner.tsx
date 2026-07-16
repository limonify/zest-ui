'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPortalContext } from '../portal/SelectPortalContext';
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
import { SelectPositionerContext } from './SelectPositionerContext';

/**
 * Positions the select popup against the trigger.
 * Renders a `<View>`.
 */
export function SelectPositioner(componentProps: SelectPositioner.Props) {
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

  useSelectPortalContext();
  const store = useSelectRootContext();
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

  const { positionerStyles, refs, update, arrowRef, arrowStyles } = positioning;

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

  const state: SelectPositionerState = { open, side: positioning.side, align: positioning.align };

  const contextValue: SelectPositionerContext = React.useMemo(
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
    <SelectPositionerContext.Provider value={contextValue}>
      {element}
    </SelectPositionerContext.Provider>
  );
}

export interface SelectPositionerState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface SelectPositionerProps
  extends UseAnchorPositioningSharedParameters,
    ZestUIComponentProps<typeof View, SelectPositionerState> {}

export namespace SelectPositioner {
  export type State = SelectPositionerState;
  export type Props = SelectPositionerProps;
}

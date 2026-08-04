'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxPortalContext } from '../portal/ComboboxPortalContext';
import { ComboboxPositionerContext } from './ComboboxPositionerContext';
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
import { useStoreState } from '../../store/ReactStore';

/**
 * Positions the list against the input.
 * Renders a `<View>`.
 */
export function ComboboxPositioner(componentProps: ComboboxPositioner.Props) {
  const {
    align = 'start',
    alignOffset = 0,
    arrowPadding = 5,
    className,
    collisionPadding = 5,
    render,
    side = 'bottom',
    sideOffset = 4,
    sticky = false,
    style,
    ref,
    ...elementProps
  } = componentProps;

  useComboboxPortalContext();
  const store = useComboboxRootContext();

  const open = useStoreState(store, 'open');
  const triggerNode = useStoreState(store, 'triggerNode');
  const triggerWidth = useStoreState(store, 'triggerWidth');
  const triggerHeight = useStoreState(store, 'triggerHeight');

  const positioning = useAnchorPositioning({
    align,
    alignOffset,
    arrowPadding,
    collisionPadding,
    side,
    sideOffset,
    sticky,
  });

  const { positionerStyles, refs, update } = positioning;

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

  const state: ComboboxPositionerState = {
    open,
    side: positioning.side,
    align: positioning.align,
    triggerWidth,
    triggerHeight,
  };

  const contextValue: ComboboxPositionerContext = React.useMemo(
    () => ({ side: positioning.side, align: positioning.align }),
    [positioning.side, positioning.align],
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
    <ComboboxPositionerContext.Provider value={contextValue}>
      {element}
    </ComboboxPositionerContext.Provider>
  );
}

export interface ComboboxPositionerState {
  open: boolean;
  side: Side;
  align: Align;
  /**
   * The input's measured width, available for consumers to apply to the popup.
   * This is the React Native equivalent of the web's `--anchor-width` CSS variable.
   */
  triggerWidth: number | undefined;
  /**
   * The input's measured height.
   */
  triggerHeight: number | undefined;
}

export interface ComboboxPositionerProps
  extends UseAnchorPositioningSharedParameters,
    ZestUIComponentProps<typeof View, ComboboxPositionerState> {}

export namespace ComboboxPositioner {
  export type State = ComboboxPositionerState;
  export type Props = ComboboxPositionerProps;
}

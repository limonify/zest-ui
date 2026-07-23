'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
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

  const { open, triggerNode, setUpdate, triggerWidth } = useComboboxRootContext();

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
    setUpdate(update);
    return () => setUpdate(undefined);
  }, [setUpdate, update]);

  const mergedRef = useMergedRefs(ref, refs.setFloating);

  const state: ComboboxPositionerState = { 
    open, 
    side: positioning.side, 
    align: positioning.align,
    triggerWidth,
  };

  return useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [{ style: positionerStyles, onLayout: () => update() }, elementProps],
  });
}

export interface ComboboxPositionerState {
  open: boolean;
  side: Side;
  align: Align;
  /**
   * The trigger's measured width, available for consumers to apply to the popup.
   * This is the React Native equivalent of the web's `--anchor-width` CSS variable.
   */
  triggerWidth: number | undefined;
}

export interface ComboboxPositionerProps
  extends UseAnchorPositioningSharedParameters,
    ZestUIComponentProps<typeof View, ComboboxPositionerState> {}

export namespace ComboboxPositioner {
  export type State = ComboboxPositionerState;
  export type Props = ComboboxPositionerProps;
}

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
  type PhysicalSide,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Positions the list against `Combobox.Trigger`, or against `Combobox.Input`
 * when there is no trigger.
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

  // A `Combobox.Trigger` is the anchor when there is one; without it the input
  // is, which is the plain combobox. The two cannot share a slot: in the
  // trigger shape the input sits *inside* this popup, and anchoring to it would
  // position the popup against itself.
  const triggerNode = useStoreState(store, 'triggerNode');
  const inputNode = useStoreState(store, 'inputNode');
  const anchorIsTrigger = triggerNode != null;
  const anchorNode = anchorIsTrigger ? triggerNode : inputNode;

  const measuredTriggerWidth = useStoreState(store, 'triggerWidth');
  const measuredTriggerHeight = useStoreState(store, 'triggerHeight');
  const measuredInputWidth = useStoreState(store, 'inputWidth');
  const measuredInputHeight = useStoreState(store, 'inputHeight');

  // The measurements follow the anchor, so `triggerWidth` still means "the
  // width of the thing this popup is positioned against".
  const triggerWidth = anchorIsTrigger ? measuredTriggerWidth : measuredInputWidth;
  const triggerHeight = anchorIsTrigger ? measuredTriggerHeight : measuredInputHeight;

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

  const { positionerStyles, refs, update } = positioning;

  useIsoLayoutEffect(() => {
    refs.setReference(anchorNode ?? null);
  }, [refs, anchorNode]);

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
  side: PhysicalSide;
  align: Align;
  /**
   * The measured width of whatever the popup is anchored to — `Combobox.Trigger`
   * if there is one, otherwise `Combobox.Input` — available for consumers to
   * apply to the popup. This is the React Native equivalent of the web's
   * `--anchor-width` CSS variable.
   */
  triggerWidth: number | undefined;
  /**
   * The anchor's measured height.
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

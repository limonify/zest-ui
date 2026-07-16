'use client';
import { View } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the select items.
 * Renders a `<View>`.
 */
export function SelectPopup(componentProps: SelectPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const { side, align } = useSelectPositionerContext();

  const open = store.useState('open');

  const state: SelectPopupState = { open, side, align };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        // Claim the touch responder so presses inside the popup never reach the
        // backdrop's outside-press handler.
        onStartShouldSetResponder: () => true,
      },
      elementProps,
    ],
  });

  // Items register here so they can be indexed in visual order.
  return <CompositeList>{element}</CompositeList>;
}

export interface SelectPopupState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface SelectPopupProps extends ZestUIComponentProps<typeof View, SelectPopupState> {}

export namespace SelectPopup {
  export type State = SelectPopupState;
  export type Props = SelectPopupProps;
}

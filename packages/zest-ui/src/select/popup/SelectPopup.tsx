'use client';
import { View } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectTransitionContext } from '../root/SelectTransitionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the select items.
 * Renders a `<View>`.
 */
export function SelectPopup(componentProps: SelectPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const { side, align } = useSelectPositionerContext();
  const { transitionStatus } = useSelectTransitionContext() ?? { transitionStatus: undefined };

  const open = store.useState('open');

  const state: SelectPopupState = { open, transitionStatus, side, align };

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
  /**
   * Whether the select is currently open.
   */
  open: boolean;
  /**
   * The transition status of the select: `'starting'` as it opens (auto-clears
   * to `undefined` after one frame), `'ending'` once it is closing.
   */
  transitionStatus: TransitionStatus;
  /**
   * The side the popup was actually placed on, after collision handling.
   */
  side: Side;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
}

export interface SelectPopupProps extends ZestUIComponentProps<typeof View, SelectPopupState> {}

export namespace SelectPopup {
  export type State = SelectPopupState;
  export type Props = SelectPopupProps;
}

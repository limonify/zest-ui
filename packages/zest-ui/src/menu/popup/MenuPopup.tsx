'use client';
import { View } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the menu items.
 * Renders a `<View>`.
 */
export function MenuPopup(componentProps: MenuPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useMenuRootContext();
  const { side, align } = useMenuPositionerContext();

  const open = store.useState('open');

  const state: MenuPopupState = { open, side, align };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'menu' as const,
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

export interface MenuPopupState {
  open: boolean;
  side: Side;
  align: Align;
}

export interface MenuPopupProps extends ZestUIComponentProps<typeof View, MenuPopupState> {}

export namespace MenuPopup {
  export type State = MenuPopupState;
  export type Props = MenuPopupProps;
}

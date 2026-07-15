'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A menu item that navigates somewhere.
 * Renders a `<Pressable>` with a link role.
 *
 * **Diverges from the web deliberately.** Upstream renders an `<a href>` and lets
 * the browser navigate. React Native has no such element and no navigator of its
 * own, so navigation happens in the consumer's `onPress` — this part contributes
 * the link role and the `link-press` reason.
 *
 * `closeOnClick` keeps upstream's `false` default, but for the opposite outcome:
 * on the web the browser navigates away and the menu goes with it, whereas an RN
 * menu is a `Modal` that would sit on top of the screen just navigated to. Set
 * `closeOnClick` when the press navigates within the app.
 */
export function MenuLinkItem(componentProps: MenuLinkItem.Props) {
  const {
    className,
    closeOnClick = false,
    disabled = false,
    onPress: onPressProp,
    render,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const store = useMenuRootContext();
  const submenuRootContext = useMenuSubmenuRootContext();

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: MenuLinkItemState = { disabled, pressed, index };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        accessibilityRole: 'link' as const,
        accessibilityState: { disabled: disabled || undefined },
        onPress(event: GestureResponderEvent) {
          if (disabled) {
            return;
          }

          onPressProp?.(event);

          if (closeOnClick) {
            store.setOpen(false, createChangeEventDetails(REASONS.linkPress, event));
            submenuRootContext?.closeAncestors(REASONS.linkPress, event);
          }
        },
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface MenuLinkItemState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is currently pressed.
   */
  pressed: boolean;
  /**
   * The item's index in the menu.
   */
  index: number;
}

export interface MenuLinkItemProps
  extends BaseUIComponentProps<typeof Pressable, MenuLinkItemState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to close the menu when the item is pressed.
   * @default false
   */
  closeOnClick?: boolean | undefined;
}

export namespace MenuLinkItem {
  export type State = MenuLinkItemState;
  export type Props = MenuLinkItemProps;
}

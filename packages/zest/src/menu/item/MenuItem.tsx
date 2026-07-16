'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * An individual interactive item in the menu.
 * Renders a `<Pressable>`.
 *
 * Upstream exposes a `highlighted` state driven by roving focus. There is no
 * keyboard to rove with on React Native, so the state here is `pressed`.
 */
export function MenuItem(componentProps: MenuItem.Props) {
  const {
    className,
    closeOnClick = true,
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

  const state: MenuItemState = { disabled, pressed, index };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        accessibilityRole: 'menuitem' as const,
        accessibilityState: { disabled: disabled || undefined },
        onPress(event: GestureResponderEvent) {
          if (disabled) {
            return;
          }

          onPressProp?.(event);

          if (closeOnClick) {
            store.setOpen(false, createChangeEventDetails(REASONS.itemPress, event));
            // Choosing an item dismisses the whole menu, not just the submenu it
            // happens to sit in.
            submenuRootContext?.closeAncestors(REASONS.itemPress, event);
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

export interface MenuItemState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is currently pressed.
   */
  pressed: boolean;
  /**
   * The item's index in the menu, in visual order.
   */
  index: number;
}

export interface MenuItemProps extends ZestUIComponentProps<typeof Pressable, MenuItemState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to close the menu when the item is pressed.
   * @default true
   */
  closeOnClick?: boolean | undefined;
}

export namespace MenuItem {
  export type State = MenuItemState;
  export type Props = MenuItemProps;
}

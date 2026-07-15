'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroupContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { MenuRadioItemContext } from './MenuRadioItemContext';

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<Pressable>`.
 *
 * Requires a `Menu.RadioGroup` and throws without one — the same rule as
 * `Radio.Root`: with no group there is no source of truth and the item would be
 * silently inert.
 *
 * Unlike `Menu.Item`, `closeOnClick` defaults to `false`.
 */
export function MenuRadioItem<Value = any>(componentProps: MenuRadioItem.Props<Value>) {
  const {
    className,
    closeOnClick = false,
    disabled: disabledProp = false,
    onPress: onPressProp,
    render,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  const store = useMenuRootContext();
  const submenuRootContext = useMenuSubmenuRootContext();
  const group = useMenuRadioGroupContext<Value>();

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);

  const checked = group.value === value;
  const disabled = disabledProp || group.disabled;

  const { getButtonProps } = useButton({ disabled });

  const state: MenuRadioItemState = { checked, disabled, pressed, index };

  const element = useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        accessibilityRole: 'menuitem' as const,
        accessibilityState: { checked, disabled: disabled || undefined },
        'aria-checked': checked,
        onPress(event: GestureResponderEvent) {
          if (disabled) {
            return;
          }

          group.setValue(value, event);
          onPressProp?.(event);

          if (closeOnClick) {
            store.setOpen(false, createChangeEventDetails(REASONS.itemPress, event));
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

  return <MenuRadioItemContext.Provider value={state}>{element}</MenuRadioItemContext.Provider>;
}

export interface MenuRadioItemState {
  /**
   * Whether the radio item is currently selected.
   */
  checked: boolean;
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

export interface MenuRadioItemProps<Value = any>
  extends Omit<BaseUIComponentProps<typeof Pressable, MenuRadioItemState>, 'value'> {
  /**
   * The value this item selects in its `Menu.RadioGroup`.
   */
  value: Value;
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

export namespace MenuRadioItem {
  export type State = MenuRadioItemState;
  export type Props<Value = any> = MenuRadioItemProps<Value>;
}

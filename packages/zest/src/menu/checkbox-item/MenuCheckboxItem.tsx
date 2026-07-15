'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useControlled } from '../../hooks/useControlled';
import type { BaseUIComponentProps } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';

/**
 * A menu item that toggles a setting on and off.
 * Renders a `<Pressable>`.
 *
 * Unlike `Menu.Item`, `closeOnClick` defaults to `false`: ticking a box is
 * usually not the end of the interaction.
 */
export function MenuCheckboxItem(componentProps: MenuCheckboxItem.Props) {
  const {
    checked: checkedProp,
    className,
    closeOnClick = false,
    defaultChecked = false,
    disabled = false,
    onCheckedChange,
    onPress: onPressProp,
    render,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const store = useMenuRootContext();
  const submenuRootContext = useMenuSubmenuRootContext();

  const { index, onLayout } = useCompositeListItem();

  const [checked, setCheckedState] = useControlled<boolean>({
    controlled: checkedProp,
    default: defaultChecked,
    name: 'MenuCheckboxItem',
    state: 'checked',
  });

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: MenuCheckboxItemState = { checked, disabled, pressed, index };

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

          const nextChecked = !checked;
          const eventDetails = createChangeEventDetails(REASONS.itemPress, event);

          onCheckedChange?.(nextChecked, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          setCheckedState(nextChecked);
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

  return (
    <MenuCheckboxItemContext.Provider value={state}>{element}</MenuCheckboxItemContext.Provider>
  );
}

export interface MenuCheckboxItemState {
  /**
   * Whether the checkbox item is currently ticked.
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

export interface MenuCheckboxItemProps
  extends BaseUIComponentProps<typeof Pressable, MenuCheckboxItemState> {
  /**
   * Whether the checkbox item is currently ticked.
   *
   * To render an uncontrolled checkbox item, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined;
  /**
   * Whether the checkbox item is initially ticked.
   *
   * To render a controlled checkbox item, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined;
  /**
   * Event handler called when the checkbox item is ticked or unticked.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: MenuCheckboxItem.ChangeEventDetails) => void)
    | undefined;
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

export type MenuCheckboxItemChangeEventReason = typeof REASONS.itemPress | typeof REASONS.none;

export type MenuCheckboxItemChangeEventDetails =
  ZestChangeEventDetails<MenuCheckboxItemChangeEventReason>;

export namespace MenuCheckboxItem {
  export type State = MenuCheckboxItemState;
  export type Props = MenuCheckboxItemProps;
  export type ChangeEventReason = MenuCheckboxItemChangeEventReason;
  export type ChangeEventDetails = MenuCheckboxItemChangeEventDetails;
}

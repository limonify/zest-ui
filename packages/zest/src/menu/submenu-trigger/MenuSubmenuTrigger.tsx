'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A menu item that opens a submenu.
 * Renders a `<Pressable>`.
 *
 * It sits in the parent's popup but drives the submenu's store, so it registers
 * with the parent's `CompositeList` for its index while opening the submenu it
 * belongs to — and doubles as the element the submenu is positioned against.
 *
 * **Diverges from the web deliberately.** Upstream opens on hover after a delay,
 * with arrow keys as the keyboard path. A touch screen has neither, so this opens
 * on press. Unlike `Menu.Item`, pressing it never closes the menu.
 */
export function MenuSubmenuTrigger(componentProps: MenuSubmenuTrigger.Props) {
  const { className, disabled = false, render, style, ref, ...elementProps } = componentProps;

  const submenuRootContext = useMenuSubmenuRootContext();
  if (submenuRootContext === undefined) {
    throw new Error(
      'Zest: Menu.SubmenuTrigger must be placed within <Menu.SubmenuRoot>, which is what tells it which menu it opens.',
    );
  }

  // Inside a SubmenuRoot this is the submenu's own store, not the parent's.
  const store = useMenuRootContext();
  const open = store.useState('open');

  // The list this item belongs to is the parent's popup, since that is where it
  // renders.
  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const anchorRef = React.useCallback(
    (node: unknown) => {
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  const state: MenuSubmenuTriggerState = { disabled, open, pressed, index };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        onLayout(event: LayoutChangeEvent) {
          onLayout(event);
          store.state.update?.();
        },
        accessibilityRole: 'menuitem' as const,
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'menu' as const,
        onPress(event: GestureResponderEvent) {
          if (disabled) {
            return;
          }

          store.setOpen(!open, createChangeEventDetails(REASONS.triggerPress, event));
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

export interface MenuSubmenuTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the submenu is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
  /**
   * The trigger's index in the parent menu.
   */
  index: number;
}

export interface MenuSubmenuTriggerProps
  extends BaseUIComponentProps<typeof Pressable, MenuSubmenuTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace MenuSubmenuTrigger {
  export type State = MenuSubmenuTriggerState;
  export type Props = MenuSubmenuTriggerProps;
}

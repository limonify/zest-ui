'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the menu, and the element it is positioned against.
 * Renders a `<Pressable>`.
 */
export function MenuTrigger(componentProps: MenuTrigger.Props) {
  const { render, className, style, disabled = false, ref, ...elementProps } = componentProps;

  const store = useMenuRootContext();
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const anchorRef = React.useCallback(
    (node: unknown) => {
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  const state: MenuTriggerState = { disabled, open, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          store.setOpen(!open, createChangeEventDetails(REASONS.triggerPress, event));
        },
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
        onLayout() {
          store.state.update?.();
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'menu' as const,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface MenuTriggerState {
  disabled: boolean;
  open: boolean;
  pressed: boolean;
}

export interface MenuTriggerProps extends BaseUIComponentProps<typeof Pressable, MenuTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace MenuTrigger {
  export type State = MenuTriggerState;
  export type Props = MenuTriggerProps;
}

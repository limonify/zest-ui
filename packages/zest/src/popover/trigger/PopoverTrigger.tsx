'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the popover, and the element it is positioned against.
 * Renders a `<Pressable>`.
 */
export function PopoverTrigger(componentProps: PopoverTrigger.Props) {
  const {
    render,
    className,
    style,
    disabled = false,
    ref,
    ...elementProps
  } = componentProps;

  const store = usePopoverRootContext();
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  // The popup lives in a portal, so the store is what carries the anchor across.
  const anchorRef = React.useCallback(
    (node: unknown) => {
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  const state: PopoverTriggerState = { disabled, open, pressed };

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
          // Nothing tracks the anchor globally in React Native, so a moved or
          // resized trigger has to ask the positioner to recompute.
          store.state.update?.();
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'dialog' as const,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface PopoverTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface PopoverTriggerProps
  extends BaseUIComponentProps<typeof Pressable, PopoverTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace PopoverTrigger {
  export type State = PopoverTriggerState;
  export type Props = PopoverTriggerProps;
}

'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * The element the tooltip describes, and the element it is positioned against.
 * Renders a `<Pressable>`.
 */
export function TooltipTrigger(componentProps: TooltipTrigger.Props) {
  const {
    render,
    className,
    style,
    disabled = false,
    longPress = false,
    ref,
    ...elementProps
  } = componentProps;

  const store = useTooltipRootContext();
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const anchorRef = React.useCallback(
    (node: unknown) => {
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  const toggle = (event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }

    store.setOpen(!open, createChangeEventDetails(REASONS.triggerPress, event));
  };

  const state: TooltipTriggerState = { disabled, open, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        // A tooltip that opens on long press leaves the plain press free for the
        // trigger's own action.
        onPress: longPress ? undefined : toggle,
        onLongPress: longPress ? toggle : undefined,
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
      },
      elementProps,
    ],
  });
}

export interface TooltipTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface TooltipTriggerProps
  extends ZestUIComponentProps<typeof Pressable, TooltipTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to open the tooltip on a long press instead of a press, leaving the
   * plain press free for the trigger's own action.
   * @default false
   */
  longPress?: boolean | undefined;
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props = TooltipTriggerProps;
}

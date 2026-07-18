'use client';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import type { CollapsibleRootState } from '../root/CollapsibleRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<Pressable>`.
 */
export function CollapsibleTrigger(componentProps: CollapsibleTrigger.Props) {
  const {
    panelId,
    open,
    handleTrigger,
    state: rootState,
    disabled: contextDisabled,
  } = useCollapsibleRootContext();

  const {
    className,
    disabled = contextDisabled,
    render,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: CollapsibleTriggerState = React.useMemo(
    () => ({ ...rootState, disabled, pressed }),
    [rootState, disabled, pressed],
  );

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPress: handleTrigger,
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-controls': open ? panelId : undefined,
        'aria-expanded': open,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface CollapsibleTriggerState extends CollapsibleRootState {
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface CollapsibleTriggerProps
  extends ZestUIComponentProps<typeof Pressable, CollapsibleTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled?: boolean | undefined;
}

export namespace CollapsibleTrigger {
  export type State = CollapsibleTriggerState;
  export type Props = CollapsibleTriggerProps;
}

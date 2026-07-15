'use client';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import type { BaseUIComponentProps } from '../../types';

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<Pressable>`.
 */
export function AccordionTrigger(componentProps: AccordionTrigger.Props) {
  const { className, disabled: disabledProp, render, style, ref, ...elementProps } = componentProps;

  const { panelId, open, handleTrigger, disabled: contextDisabled } = useCollapsibleRootContext();
  const { state: itemState, triggerId } = useAccordionItemContext();

  const disabled = disabledProp || contextDisabled;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: AccordionTriggerState = React.useMemo(
    () => ({ ...itemState, disabled, pressed }),
    [itemState, disabled, pressed],
  );

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        nativeID: triggerId,
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

export interface AccordionTriggerState extends AccordionItemState {
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface AccordionTriggerProps
  extends BaseUIComponentProps<typeof Pressable, AccordionTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled?: boolean | undefined;
}

export namespace AccordionTrigger {
  export type State = AccordionTriggerState;
  export type Props = AccordionTriggerProps;
}

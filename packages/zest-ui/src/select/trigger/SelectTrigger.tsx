'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the select popup, and the element it is positioned against.
 * Renders a `<Pressable>`.
 */
export function SelectTrigger(componentProps: SelectTrigger.Props) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    ref,
    ...elementProps
  } = componentProps;

  const store = useSelectRootContext();
  const open = store.useState('open');
  const rootDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const required = store.useState('required');
  const labelId = store.useState('labelId');

  const disabled = rootDisabled || disabledProp;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const anchorRef = React.useCallback(
    (node: unknown) => {
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  const state: SelectTriggerState = { disabled, open, pressed, readOnly, required };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          if (readOnly) {
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
        onLayout() {
          store.state.update?.();
        },
        accessibilityRole: 'combobox' as const,
        accessibilityLabelledBy: labelId,
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'listbox' as const,
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface SelectTriggerState {
  disabled: boolean;
  open: boolean;
  pressed: boolean;
  readOnly: boolean;
  required: boolean;
}

export interface SelectTriggerProps
  extends ZestUIComponentProps<typeof Pressable, SelectTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace SelectTrigger {
  export type State = SelectTriggerState;
  export type Props = SelectTriggerProps;
}

'use client';
import * as React from 'react';
import { TextInput } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { ZestUIComponentProps } from '../../types';

/**
 * The text input that filters the list, and the element the popup is anchored to.
 * Renders a `<TextInput>`.
 */
export function ComboboxInput(componentProps: ComboboxInput.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const {
    open,
    setOpen,
    inputValue,
    setInputValue,
    disabled,
    setTriggerNode,
    update,
  } = useComboboxRootContext();

  const anchorRef = React.useCallback(
    (node: unknown) => {
      setTriggerNode(node);
    },
    [setTriggerNode],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  const state: ComboboxInputState = { open, disabled };

  return useRenderElement(TextInput, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        value: inputValue,
        editable: !disabled,
        onChangeText(text: string) {
          setInputValue(text);
        },
        onFocus() {
          setOpen(true);
        },
        onLayout() {
          update?.();
        },
        accessibilityRole: 'search' as const,
        'aria-expanded': open,
        'aria-autocomplete': 'list' as const,
      },
      elementProps,
    ],
  });
}

export interface ComboboxInputState {
  open: boolean;
  disabled: boolean;
}

export interface ComboboxInputProps
  extends Omit<ZestUIComponentProps<typeof TextInput, ComboboxInputState>, 'value'> {}

export namespace ComboboxInput {
  export type State = ComboboxInputState;
  export type Props = ComboboxInputProps;
}

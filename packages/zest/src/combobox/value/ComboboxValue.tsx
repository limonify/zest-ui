'use client';
import type * as React from 'react';
import { Text } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';

/**
 * Displays the current input text (the selected label in combobox mode).
 * Renders a `<Text>`. Reads `state.value` in a style/render function for custom
 * formatting.
 */
export function ComboboxValue(componentProps: ComboboxValue.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const { inputValue } = useComboboxRootContext();

  const state: ComboboxValueState = { value: inputValue };

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ children: children ?? inputValue }, elementProps],
  });
}

export interface ComboboxValueState {
  value: string;
}

export interface ComboboxValueProps
  extends Omit<ZestUIComponentProps<typeof Text, ComboboxValueState>, 'children'> {
  children?: React.ReactNode;
}

export namespace ComboboxValue {
  export type State = ComboboxValueState;
  export type Props = ComboboxValueProps;
}

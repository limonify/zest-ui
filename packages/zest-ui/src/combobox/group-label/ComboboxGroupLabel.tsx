'use client';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useComboboxGroupContext } from '../group/ComboboxGroupContext';
import { EMPTY_OBJECT } from '../../utils/empty';
import type { ZestUIComponentProps } from '../../types';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<Text>`.
 */
export function ComboboxGroupLabel(componentProps: ComboboxGroupLabel.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { labelId } = useComboboxGroupContext();

  const state: ComboboxGroupLabelState = EMPTY_OBJECT;

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: labelId, role: 'heading' as const }, elementProps],
  });
}

export interface ComboboxGroupLabelState {}

export interface ComboboxGroupLabelProps
  extends ZestUIComponentProps<typeof Text, ComboboxGroupLabelState> {}

export namespace ComboboxGroupLabel {
  export type State = ComboboxGroupLabelState;
  export type Props = ComboboxGroupLabelProps;
}

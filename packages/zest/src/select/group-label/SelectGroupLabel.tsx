'use client';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useSelectGroupContext } from '../group/SelectGroupContext';
import type { BaseUIComponentProps } from '../../types';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<Text>`.
 */
export function SelectGroupLabel(componentProps: SelectGroupLabel.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { labelId } = useSelectGroupContext();

  const state: SelectGroupLabelState = {};

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: labelId, role: 'heading' as const }, elementProps],
  });
}

export interface SelectGroupLabelState {}

export interface SelectGroupLabelProps
  extends BaseUIComponentProps<typeof Text, SelectGroupLabelState> {}

export namespace SelectGroupLabel {
  export type State = SelectGroupLabelState;
  export type Props = SelectGroupLabelProps;
}

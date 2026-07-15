'use client';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMenuGroupContext } from '../group/MenuGroupContext';
import type { BaseUIComponentProps } from '../../types';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<Text>`.
 */
export function MenuGroupLabel(componentProps: MenuGroupLabel.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { labelId } = useMenuGroupContext();

  const state: MenuGroupLabelState = {};

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: labelId, role: 'heading' as const }, elementProps],
  });
}

export interface MenuGroupLabelState {}

export interface MenuGroupLabelProps
  extends BaseUIComponentProps<typeof Text, MenuGroupLabelState> {}

export namespace MenuGroupLabel {
  export type State = MenuGroupLabelState;
  export type Props = MenuGroupLabelProps;
}

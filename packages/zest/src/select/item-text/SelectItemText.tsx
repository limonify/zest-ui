'use client';
import * as React from 'react';
import { Text } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectItemContext } from '../item/SelectItemContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { SelectItemState } from '../item/SelectItem';
import type { BaseUIComponentProps } from '../../types';

/**
 * The text label of a select item.
 * Renders a `<Text>`.
 *
 * Registers its text with the root so `Select.Value` can render the selected
 * item's label without the consumer duplicating the value-to-label mapping.
 */
export function SelectItemText(componentProps: SelectItemText.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const { state, value } = useSelectItemContext();

  useIsoLayoutEffect(() => {
    if (typeof children === 'string') {
      store.registerLabel(value, children);
    }
  }, [store, value, children]);

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [elementProps, { children }],
  });
}

export interface SelectItemTextState extends SelectItemState {}

export interface SelectItemTextProps
  extends BaseUIComponentProps<typeof Text, SelectItemTextState> {}

export namespace SelectItemText {
  export type State = SelectItemTextState;
  export type Props = SelectItemTextProps;
}

'use client';
import { Text } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { resolveSelectLabel } from '../store/SelectStore';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';

/**
 * The label of the currently selected item.
 * Renders a `<Text>`.
 *
 * The label comes from `Select.Root`'s `items` prop, falling back to the labels
 * `Select.ItemText` registers as items mount. Without `items` the label is only
 * known after the popup has been opened once, since that is when the items first
 * render. Pass `children` as a function to format it yourself.
 */
export function SelectValue(componentProps: SelectValue.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const value = store.useState('value');
  const labelsByValue = store.useState('labelsByValue');
  const items = store.useState('items');

  const label = resolveSelectLabel(items, labelsByValue, value);

  const state: SelectValueState = { value, label };

  const resolvedChildren = typeof children === 'function' ? children(state) : (children ?? label);

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [elementProps, { children: resolvedChildren }],
  });
}

export interface SelectValueState {
  /**
   * The currently selected value.
   */
  value: unknown;
  /**
   * The label registered by the selected item's `Select.ItemText`, if any.
   */
  label: string | undefined;
}

export interface SelectValueProps
  extends Omit<BaseUIComponentProps<typeof Text, SelectValueState>, 'children'> {
  children?: React.ReactNode | ((state: SelectValueState) => React.ReactNode);
}

export namespace SelectValue {
  export type State = SelectValueState;
  export type Props = SelectValueProps;
}

'use client';
import { Text } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { resolveSelectLabel } from '../store/SelectStore';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * The label of the currently selected item.
 * Renders a `<Text>`.
 *
 * The label comes from `Select.Root`'s `items` prop, falling back to the labels
 * `Select.ItemText` registers as items mount. Without `items` the label is only
 * known after the popup has been opened once, since that is when the items first
 * render. Pass `children` as a function to format it yourself.
 *
 * In a `multiple` select there are several labels, so `label` is them joined
 * with a comma and `labels` holds them individually — a comma is rarely the
 * right separator, so format from `labels` when it matters.
 */
export function SelectValue(componentProps: SelectValue.Props) {
  const { render, className, style, children, placeholder, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const value = useStoreState(store, 'value');
  const labelsByValue = useStoreState(store, 'labelsByValue');
  const items = useStoreState(store, 'items');
  const multiple = useStoreState(store, 'multiple');
  const isItemEqualToValue = useStoreState(store, 'isItemEqualToValue');

  const labels =
    multiple && Array.isArray(value)
      ? value
          .map((item) => resolveSelectLabel(items, labelsByValue, item, isItemEqualToValue))
          .filter((item): item is string => item !== undefined)
      : [resolveSelectLabel(items, labelsByValue, value, isItemEqualToValue)].filter(
          (item): item is string => item !== undefined,
        );

  const label = labels.length > 0 ? labels.join(', ') : undefined;

  const state: SelectValueState = { value, label, labels, placeholder: label === undefined };

  const resolvedChildren =
    typeof children === 'function' ? children(state) : (children ?? label ?? placeholder);

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
   * The selected item's label, if it is known. In a `multiple` select, every
   * selected label joined with a comma.
   */
  label: string | undefined;
  /**
   * Every selected label, in selection order. Empty when nothing is selected or
   * no label is known yet.
   */
  labels: string[];
  /**
   * Whether the placeholder is what is being shown, because no label is known.
   */
  placeholder: boolean;
}

export interface SelectValueProps
  extends Omit<ZestUIComponentProps<typeof Text, SelectValueState>, 'children'> {
  children?: React.ReactNode | ((state: SelectValueState) => React.ReactNode);
  /**
   * Shown while nothing is selected — or while the selected label is not known
   * yet, which is the case before the popup has been opened once unless
   * `Select.Root` was given `items`. `children` takes precedence.
   */
  placeholder?: React.ReactNode;
}

export namespace SelectValue {
  export type State = SelectValueState;
  export type Props = SelectValueProps;
}

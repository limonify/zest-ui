'use client';
import * as React from 'react';
import { Text } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxSelectionContext } from '../root/ComboboxSelectionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ComboboxItem } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Displays the current input text (the selected label in a single-selection
 * combobox).
 * Renders a `<Text>`. Reads `state.value` in a style/render function for custom
 * formatting.
 *
 * Pass a **function** as `children` to render the selection yourself — it
 * receives the selected items and this part then renders no element of its own,
 * so chips are not trapped inside a `<Text>`:
 *
 * ```tsx
 * <Combobox.Value>
 *   {(items) => items.map((item) => <Combobox.Chip key={String(item.value)}>…</Combobox.Chip>)}
 * </Combobox.Value>
 * ```
 *
 * `style`, `className` and `render` do nothing in that form.
 */
export function ComboboxValue(componentProps: ComboboxValue.Props) {
  const { render, className, style, children, placeholder, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { selectedItems } = useComboboxSelectionContext();
  const inputValue = useStoreState(store, 'inputValue');

  const rendersSelection = typeof children === 'function';

  const showsPlaceholder = !rendersSelection && children == null && inputValue === '';

  const state: ComboboxValueState = {
    value: inputValue,
    items: selectedItems,
    placeholder: showsPlaceholder,
  };

  const element = useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [
      {
        children: rendersSelection ? undefined : (children ?? (showsPlaceholder ? placeholder : inputValue)),
      },
      elementProps,
    ],
    enabled: !rendersSelection,
  });

  if (rendersSelection) {
    return <React.Fragment>{children(selectedItems)}</React.Fragment>;
  }

  return element;
}

export interface ComboboxValueState {
  /**
   * The current input text.
   */
  value: string;
  /**
   * The selected value(s), resolved to items. Empty when nothing is selected,
   * and at most one entry unless the combobox is `multiple`.
   */
  items: ComboboxItem[];
  /**
   * Whether the placeholder is what is being shown, because there is no text.
   */
  placeholder: boolean;
}

export interface ComboboxValueProps
  extends Omit<ZestUIComponentProps<typeof Text, ComboboxValueState>, 'children'> {
  /**
   * The content to render. A function receives the selected items and replaces
   * this part's own element entirely.
   */
  children?: React.ReactNode | ((items: ComboboxItem[]) => React.ReactNode);
  /**
   * Shown while the input is empty. `children` takes precedence, and a function
   * `children` replaces this part entirely.
   */
  placeholder?: React.ReactNode;
}

export namespace ComboboxValue {
  export type State = ComboboxValueState;
  export type Props = ComboboxValueProps;
}

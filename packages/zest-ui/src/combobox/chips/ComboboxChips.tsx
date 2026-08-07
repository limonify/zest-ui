'use client';
import { View } from 'react-native';
import { useComboboxSelectionContext } from '../root/ComboboxSelectionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the chips of a `multiple` combobox, and usually for the input
 * beside them.
 * Renders a `<View>`.
 *
 * ```tsx
 * <Combobox.Chips>
 *   <Combobox.Value>
 *     {(items) => items.map((item) => (
 *       <Combobox.Chip key={String(item.value)}>
 *         <Text>{item.label}</Text>
 *         <Combobox.ChipRemove accessibilityLabel={`Remove ${item.label}`} />
 *       </Combobox.Chip>
 *     ))}
 *   </Combobox.Value>
 *   <Combobox.Input />
 * </Combobox.Chips>
 * ```
 */
export function ComboboxChips(componentProps: ComboboxChips.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { selectedItems } = useComboboxSelectionContext();

  const empty = selectedItems.length === 0;

  const state: ComboboxChipsState = { empty };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      // Upstream marks the container as a toolbar only once it holds chips, so
      // an empty one is not announced as an interactive group.
      empty ? {} : { role: 'toolbar' as const },
      elementProps,
    ],
  });

  // Chips register here so each learns its index in the selection.
  return <CompositeList>{element}</CompositeList>;
}

export interface ComboboxChipsState {
  /**
   * Whether nothing is selected, so there are no chips to render.
   */
  empty: boolean;
}

export interface ComboboxChipsProps extends ZestUIComponentProps<typeof View, ComboboxChipsState> {}

export namespace ComboboxChips {
  export type State = ComboboxChipsState;
  export type Props = ComboboxChipsProps;
}

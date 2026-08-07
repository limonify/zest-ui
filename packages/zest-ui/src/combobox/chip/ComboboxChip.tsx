'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useComboboxSelectionContext } from '../root/ComboboxSelectionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { ComboboxChipContext } from './ComboboxChipContext';
import type { ComboboxItem } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';

/**
 * An individual chip standing for one selected value.
 * Renders a `<View>`.
 *
 * Its position among its siblings is what `Combobox.ChipRemove` removes, so
 * render chips in selection order — mapping over the items `Combobox.Value`
 * hands you does exactly that.
 *
 * Upstream's arrow-key navigation between chips is not ported: there is no Tab
 * key on mobile, so there is no roving focus to move.
 */
export function ComboboxChip(componentProps: ComboboxChip.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { selectedItems } = useComboboxSelectionContext();
  const { index, onLayout } = useCompositeListItem();

  const item = selectedItems[index];

  const state: ComboboxChipState = React.useMemo(() => ({ index, item }), [index, item]);

  const contextValue: ComboboxChipContext = React.useMemo(() => ({ index, item }), [index, item]);

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ onLayout }, elementProps],
  });

  return <ComboboxChipContext.Provider value={contextValue}>{element}</ComboboxChipContext.Provider>;
}

export interface ComboboxChipState {
  /**
   * The chip's index in the selection, in visual order.
   */
  index: number;
  /**
   * The selected item this chip stands for, if the selection reaches that far.
   */
  item: ComboboxItem | undefined;
}

export interface ComboboxChipProps extends ZestUIComponentProps<typeof View, ComboboxChipState> {}

export namespace ComboboxChip {
  export type State = ComboboxChipState;
  export type Props = ComboboxChipProps;
}

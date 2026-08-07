'use client';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxItemsContext } from '../root/ComboboxItemsContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Shown when no items match the current query.
 * Renders a `<View>`, or nothing when there are matches.
 */
export function ComboboxEmpty(componentProps: ComboboxEmpty.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItemCount } = useComboboxItemsContext();

  const open = useStoreState(store, 'open');

  const state: ComboboxEmptyState = { open };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    // Counting selectable items, not entries: a group that filtered down to
    // nothing is still an entry, and the list is still empty.
    enabled: filteredItemCount === 0,
    props: [{ accessibilityLiveRegion: 'polite' as const }, elementProps],
  });
}

export interface ComboboxEmptyState {
  open: boolean;
}

export interface ComboboxEmptyProps extends ZestUIComponentProps<typeof View, ComboboxEmptyState> {}

export namespace ComboboxEmpty {
  export type State = ComboboxEmptyState;
  export type Props = ComboboxEmptyProps;
}

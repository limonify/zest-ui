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
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItemCount } = useComboboxItemsContext();

  const open = useStoreState(store, 'open');

  const empty = filteredItemCount === 0;

  const state: ComboboxEmptyState = { open, empty };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    // Counting selectable items, not entries: a group that filtered down to
    // nothing is still an entry, and the list is still empty.
    enabled: empty || keepMounted,
    props: [{ accessibilityLiveRegion: 'polite' as const }, elementProps],
  });
}

export interface ComboboxEmptyState {
  /**
   * Whether the list is currently open.
   */
  open: boolean;
  /**
   * Whether nothing matched the query. Only useful with `keepMounted`, since
   * otherwise this part only renders when it is `true`.
   */
  empty: boolean;
}

export interface ComboboxEmptyProps extends ZestUIComponentProps<typeof View, ComboboxEmptyState> {
  /**
   * Whether to keep the element mounted while something still matches, so it
   * can be hidden with a style instead. Required to animate it out — nothing in
   * React Native can report that an exit animation finished.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ComboboxEmpty {
  export type State = ComboboxEmptyState;
  export type Props = ComboboxEmptyProps;
}

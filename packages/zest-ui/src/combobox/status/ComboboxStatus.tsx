'use client';
import type * as React from 'react';
import { Text } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxItemsContext } from '../root/ComboboxItemsContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Announces how the list changed as the query narrows it.
 * Renders a `<Text>` as a polite live region.
 *
 * Filtering happens without moving focus, so a screen reader is never told that
 * the list behind the input just changed. This part is what tells it. Give it
 * your own wording through `children` or a render function — the default is
 * English:
 *
 * ```tsx
 * <Combobox.Status>
 *   {(state) => (state.count === 0 ? 'Sonuç yok' : `${state.count} sonuç`)}
 * </Combobox.Status>
 * ```
 *
 * It renders nothing while the list is closed, so a closed combobox announces
 * nothing.
 */
export function ComboboxStatus(componentProps: ComboboxStatus.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItemCount } = useComboboxItemsContext();

  const open = useStoreState(store, 'open');

  const state: ComboboxStatusState = { count: filteredItemCount, open };

  const resolved = typeof children === 'function' ? children(state) : children;

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    enabled: open,
    props: [
      {
        accessibilityLiveRegion: 'polite' as const,
        role: 'status' as const,
        children: resolved ?? defaultStatus(filteredItemCount),
      },
      elementProps,
    ],
  });
}

function defaultStatus(count: number) {
  if (count === 0) {
    return 'No results';
  }

  return count === 1 ? '1 result' : `${count} results`;
}

export interface ComboboxStatusState {
  /**
   * How many selectable items survived filtering, with groups flattened away.
   */
  count: number;
  /**
   * Whether the list is currently open.
   */
  open: boolean;
}

export interface ComboboxStatusProps
  extends Omit<ZestUIComponentProps<typeof Text, ComboboxStatusState>, 'children'> {
  /**
   * The announcement. A function receives the state, which is how you localize
   * it. Defaults to an English result count.
   */
  children?: React.ReactNode | ((state: ComboboxStatusState) => React.ReactNode);
}

export namespace ComboboxStatus {
  export type State = ComboboxStatusState;
  export type Props = ComboboxStatusProps;
}

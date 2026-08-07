'use client';
import { ScrollView } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStoreState } from '../../store/ReactStore';
import type { ZestUIComponentProps } from '../../types';

/**
 * A scrollable list of the select items.
 * Renders a `<ScrollView>` with the `listbox` role.
 *
 * Upstream pairs this with `ScrollUpArrow`/`ScrollDownArrow` parts; a
 * `ScrollView` scrolls natively on touch, so those are not ported.
 */
export function SelectList(componentProps: SelectList.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const open = useStoreState(store, 'open');

  const state: SelectListState = { open };

  return useRenderElement(ScrollView, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'list' as const,
        role: 'listbox' as const,
        keyboardShouldPersistTaps: 'handled' as const,
        keyboardDismissMode: 'on-drag' as const,
      },
      elementProps,
    ],
  });
}

export interface SelectListState {
  /**
   * Whether the select popup is currently open. `Combobox.List` publishes the
   * same, so a list styled from state reads the same either way.
   */
  open: boolean;
}

export interface SelectListProps extends ZestUIComponentProps<typeof ScrollView, SelectListState> {}

export namespace SelectList {
  export type State = SelectListState;
  export type Props = SelectListProps;
}

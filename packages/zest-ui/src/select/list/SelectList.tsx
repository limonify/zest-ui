'use client';
import { ScrollView } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
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

  const state: SelectListState = {};

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

export interface SelectListState {}

export interface SelectListProps extends ZestUIComponentProps<typeof ScrollView, SelectListState> {}

export namespace SelectList {
  export type State = SelectListState;
  export type Props = SelectListProps;
}

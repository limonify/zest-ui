'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { EMPTY_OBJECT } from '../../utils/empty';
import type { ComboboxItem } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';
import { ComboboxGroupContext } from './ComboboxGroupContext';

/**
 * Groups related items with the corresponding label.
 * Renders a `<View>`.
 *
 * Pass the group's `items` so `Combobox.Collection` inside it renders those
 * rather than the whole filtered list:
 *
 * ```tsx
 * <Combobox.List>
 *   {(group) => (
 *     <Combobox.Group key={String(group.value)} items={group.items}>
 *       <Combobox.GroupLabel>{group.label}</Combobox.GroupLabel>
 *       <Combobox.Collection>
 *         {(item) => <Combobox.Item key={String(item.value)} item={item} />}
 *       </Combobox.Collection>
 *     </Combobox.Group>
 *   )}
 * </Combobox.List>
 * ```
 *
 * Groups only ever hold items that survived the query — a group whose items all
 * filtered out is dropped from the list entirely, so it never renders empty.
 */
export function ComboboxGroup(componentProps: ComboboxGroup.Props) {
  const { render, className, style, items, ref, ...elementProps } = componentProps;

  const labelId = useId();

  const contextValue: ComboboxGroupContext = React.useMemo(
    () => ({ labelId, items }),
    [labelId, items],
  );

  const state: ComboboxGroupState = EMPTY_OBJECT;

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        role: 'group' as const,
        accessibilityLabelledBy: labelId,
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  return <ComboboxGroupContext.Provider value={contextValue}>{element}</ComboboxGroupContext.Provider>;
}

export interface ComboboxGroupState {}

export interface ComboboxGroupProps extends ZestUIComponentProps<typeof View, ComboboxGroupState> {
  /**
   * The items belonging to this group, as handed to you by `Combobox.List`.
   * `Combobox.Collection` inside the group renders these.
   */
  items?: ComboboxItem[] | undefined;
}

export namespace ComboboxGroup {
  export type State = ComboboxGroupState;
  export type Props = ComboboxGroupProps;
}

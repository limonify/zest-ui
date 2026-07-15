'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import type { BaseUIComponentProps } from '../../types';
import { SelectGroupContext } from './SelectGroupContext';

/**
 * Groups related select items with the corresponding label.
 * Renders a `<View>`.
 */
export function SelectGroup(componentProps: SelectGroup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const labelId = useId();

  const contextValue: SelectGroupContext = React.useMemo(() => ({ labelId }), [labelId]);

  const state: SelectGroupState = {};

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

  return <SelectGroupContext.Provider value={contextValue}>{element}</SelectGroupContext.Provider>;
}

export interface SelectGroupState {}

export interface SelectGroupProps extends BaseUIComponentProps<typeof View, SelectGroupState> {}

export namespace SelectGroup {
  export type State = SelectGroupState;
  export type Props = SelectGroupProps;
}

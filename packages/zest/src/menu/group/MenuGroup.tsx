'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import type { BaseUIComponentProps } from '../../types';
import { MenuGroupContext } from './MenuGroupContext';

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<View>`.
 */
export function MenuGroup(componentProps: MenuGroup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const labelId = useId();

  const contextValue: MenuGroupContext = React.useMemo(() => ({ labelId }), [labelId]);

  const state: MenuGroupState = {};

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

  return <MenuGroupContext.Provider value={contextValue}>{element}</MenuGroupContext.Provider>;
}

export interface MenuGroupState {}

export interface MenuGroupProps extends BaseUIComponentProps<typeof View, MenuGroupState> {}

export namespace MenuGroup {
  export type State = MenuGroupState;
  export type Props = MenuGroupProps;
}

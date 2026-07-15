'use client';
import { View } from 'react-native';
import type { BaseUIComponentProps, Orientation } from '../types';
import { useRenderElement } from '../use-render/useRenderElement';

/**
 * A separator element accessible to screen readers.
 * Renders a `<View>`.
 */
export function Separator(componentProps: Separator.Props) {
  const {
    className,
    render,
    orientation = 'horizontal',
    style,
    ref,
    ...elementProps
  } = componentProps;

  const state: SeparatorState = { orientation };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ role: 'separator', 'aria-orientation': orientation }, elementProps],
  });

  return element;
}

export interface SeparatorProps extends BaseUIComponentProps<typeof View, SeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}

export interface SeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}

export namespace Separator {
  export type Props = SeparatorProps;
  export type State = SeparatorState;
}

'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { SliderRootState } from '../root/SliderRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * The visual rail the thumb travels along.
 * Renders a `<View>`.
 */
export function SliderTrack(componentProps: SliderTrack.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { state } = useSliderRootContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface SliderTrackState extends SliderRootState {}

export interface SliderTrackProps extends ZestUIComponentProps<typeof View, SliderTrackState> {}

export namespace SliderTrack {
  export type State = SliderTrackState;
  export type Props = SliderTrackProps;
}

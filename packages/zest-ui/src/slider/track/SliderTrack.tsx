'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { getSliderRootState } from '../store/SliderStore';
import type { SliderRootState } from '../root/SliderRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * The visual rail the thumb travels along.
 * Renders a `<View>`.
 *
 * The track is static — nothing about it changes while a thumb is dragged — so
 * it subscribes to no selector and does not re-render once per frame. Its
 * published state is the latest snapshot at its last render.
 */
export function SliderTrack(componentProps: SliderTrack.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSliderRootContext();

  return useRenderElement(View, componentProps, {
    state: getSliderRootState(store),
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

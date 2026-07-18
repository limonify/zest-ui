'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { SliderRootState } from '../root/SliderRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * The filled portion of the track.
 * Renders a `<View>` positioned to span the selected range.
 */
export function SliderIndicator(componentProps: SliderIndicator.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { max, min, orientation, state, values } = useSliderRootContext();

  // A single-thumb slider fills from the start; a range fills between thumbs.
  const start = values.length > 1 ? Math.min(...values) : min;
  const end = values.length > 1 ? Math.max(...values) : values[0]!;

  const startPercent = toPercent(start, min, max);
  const endPercent = toPercent(end, min, max);

  const offset = `${startPercent}%` as const;
  const size = `${endPercent - startPercent}%` as const;

  const positionStyle =
    orientation === 'vertical'
      ? { position: 'absolute' as const, bottom: offset, height: size }
      : { position: 'absolute' as const, left: offset, width: size };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ style: positionStyle }, elementProps],
  });
}

function toPercent(value: number, min: number, max: number) {
  if (max === min) {
    return 0;
  }

  return ((value - min) / (max - min)) * 100;
}

export interface SliderIndicatorState extends SliderRootState {}

export interface SliderIndicatorProps
  extends ZestUIComponentProps<typeof View, SliderIndicatorState> {}

export namespace SliderIndicator {
  export type State = SliderIndicatorState;
  export type Props = SliderIndicatorProps;
}

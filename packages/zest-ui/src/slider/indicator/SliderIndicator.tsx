'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useStoreState } from '../../store/ReactStore';
import { useRenderElement } from '../../use-render/useRenderElement';
import { getSliderRootState } from '../store/SliderStore';
import type { SliderRootState } from '../root/SliderRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * The filled portion of the track.
 * Renders a `<View>` positioned to span the selected range.
 */
export function SliderIndicator(componentProps: SliderIndicator.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSliderRootContext();

  // The indicator's span depends on the range endpoints, so it subscribes to the
  // whole values array — that is what changes while a thumb is dragged.
  const values = useStoreState(store, 'values');

  const { direction, max, min, orientation } = store.context;

  // A single-thumb slider fills from the start; a range fills between thumbs.
  const start = values.length > 1 ? Math.min(...values) : min;
  const end = values.length > 1 ? Math.max(...values) : values[0]!;

  const startPercent = toPercent(start, min, max);
  const endPercent = toPercent(end, min, max);

  const offset = `${startPercent}%` as const;
  const size = `${endPercent - startPercent}%` as const;

  // Anchored from the track's start, which is the right edge under RTL.
  const positionStyle =
    orientation === 'vertical'
      ? { position: 'absolute' as const, bottom: offset, height: size }
      : direction === 'rtl'
        ? { position: 'absolute' as const, right: offset, width: size }
        : { position: 'absolute' as const, left: offset, width: size };

  return useRenderElement(View, componentProps, {
    state: getSliderRootState(store),
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

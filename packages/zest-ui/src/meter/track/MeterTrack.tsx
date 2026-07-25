'use client';
import { View } from 'react-native';
import { useMeterRootContext } from '../root/MeterRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { MeterRootState } from '../root/MeterRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Contains the meter indicator.
 * Renders a `<View>`.
 */
export function MeterTrack(componentProps: MeterTrack.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { state } = useMeterRootContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface MeterTrackState extends MeterRootState {}

export interface MeterTrackProps extends ZestUIComponentProps<typeof View, MeterTrackState> {}

export namespace MeterTrack {
  export type State = MeterTrackState;
  export type Props = MeterTrackProps;
}

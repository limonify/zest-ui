'use client';
import { View } from 'react-native';
import { useMeterRootContext } from '../root/MeterRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';

/**
 * Contains the meter indicator.
 * Renders a `<View>`.
 */
export function MeterTrack(componentProps: MeterTrack.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  useMeterRootContext();

  const state: MeterTrackState = {};

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface MeterTrackState {}

export interface MeterTrackProps extends ZestUIComponentProps<typeof View, MeterTrackState> {}

export namespace MeterTrack {
  export type State = MeterTrackState;
  export type Props = MeterTrackProps;
}

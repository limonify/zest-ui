'use client';
import { View } from 'react-native';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ProgressRootState } from '../root/ProgressRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * Contains the progress bar indicator.
 * Renders a `<View>`.
 */
export function ProgressTrack(componentProps: ProgressTrack.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { state } = useProgressRootContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface ProgressTrackState extends ProgressRootState {}

export interface ProgressTrackProps extends BaseUIComponentProps<typeof View, ProgressTrackState> {}

export namespace ProgressTrack {
  export type State = ProgressTrackState;
  export type Props = ProgressTrackProps;
}

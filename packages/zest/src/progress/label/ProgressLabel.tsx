'use client';
import { Text } from 'react-native';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { ProgressRootState } from '../root/ProgressRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * An accessible label for the progress bar.
 * Renders a `<Text>`.
 */
export function ProgressLabel(componentProps: ProgressLabel.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { setLabelId, state } = useProgressRootContext();

  const id = useId(idProp ?? undefined);

  useIsoLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: id }, elementProps],
  });
}

export interface ProgressLabelState extends ProgressRootState {}

export interface ProgressLabelProps extends ZestUIComponentProps<typeof Text, ProgressLabelState> {}

export namespace ProgressLabel {
  export type State = ProgressLabelState;
  export type Props = ProgressLabelProps;
}

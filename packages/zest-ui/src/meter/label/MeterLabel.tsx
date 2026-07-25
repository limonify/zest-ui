'use client';
import { Text } from 'react-native';
import { useMeterRootContext } from '../root/MeterRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { MeterRootState } from '../root/MeterRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * An accessible label for the meter.
 * Renders a `<Text>`.
 */
export function MeterLabel(componentProps: MeterLabel.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { setLabelId, state } = useMeterRootContext();

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

export interface MeterLabelState extends MeterRootState {}

export interface MeterLabelProps extends ZestUIComponentProps<typeof Text, MeterLabelState> {}

export namespace MeterLabel {
  export type State = MeterLabelState;
  export type Props = MeterLabelProps;
}

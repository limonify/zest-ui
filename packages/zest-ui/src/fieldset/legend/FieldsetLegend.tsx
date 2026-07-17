'use client';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';
import type { FieldsetRoot } from '../root/FieldsetRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * An accessible label for the fieldset.
 * Renders a `<Text>`.
 */
export function FieldsetLegend(componentProps: FieldsetLegend.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { setLegendId, disabled } = useFieldsetRootContext();

  const id = useId(idProp ?? undefined);

  useIsoLayoutEffect(() => {
    setLegendId(id);
    return () => setLegendId(undefined);
  }, [id, setLegendId]);

  const state: FieldsetLegend.State = { disabled };

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: id, role: 'heading' as const }, elementProps],
  });
}

export interface FieldsetLegendState extends FieldsetRoot.State {}

export interface FieldsetLegendProps
  extends ZestUIComponentProps<typeof Text, FieldsetLegendState> {}

export namespace FieldsetLegend {
  export type State = FieldsetLegendState;
  export type Props = FieldsetLegendProps;
}

'use client';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useFieldRootContext } from '../root/FieldRootContext';
import type { FieldRoot } from '../root/FieldRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * An accessible label associated with the field's control.
 * Renders a `<Text>`.
 */
export function FieldLabel(componentProps: FieldLabel.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { setLabelId, state } = useFieldRootContext();

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

export interface FieldLabelState extends FieldRoot.State {}

export interface FieldLabelProps extends ZestUIComponentProps<typeof Text, FieldLabelState> {}

export namespace FieldLabel {
  export type State = FieldLabelState;
  export type Props = FieldLabelProps;
}

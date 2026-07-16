'use client';
import { Text } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { ZestUIComponentProps } from '../../types';

/**
 * An accessible label that is automatically associated with the select trigger.
 * Renders a `<Text>`.
 */
export function SelectLabel(componentProps: SelectLabel.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();

  const id = useId(idProp ?? undefined);

  useIsoLayoutEffect(() => {
    store.set('labelId', id);
    return () => store.set('labelId', undefined);
  }, [id, store]);

  const state: SelectLabelState = {};

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: id }, elementProps],
  });
}

export interface SelectLabelState {}

export interface SelectLabelProps extends ZestUIComponentProps<typeof Text, SelectLabelState> {}

export namespace SelectLabel {
  export type State = SelectLabelState;
  export type Props = SelectLabelProps;
}

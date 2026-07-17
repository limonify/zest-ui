'use client';
import { Text } from 'react-native';
import { useToastRootContext } from '../root/ToastRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { ToastRootState } from '../root/ToastRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * A description that gives the toast more detail.
 * Renders a `<Text>`.
 *
 * Falls back to the toast's `description` when given no children.
 */
export function ToastDescription(componentProps: ToastDescription.Props) {
  const { render, className, style, children, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { toast, state, setDescriptionId } = useToastRootContext();

  const id = useId(idProp ?? undefined);

  useIsoLayoutEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [
      { nativeID: id, children: children ?? toast.description },
      elementProps,
    ],
    enabled: (children ?? toast.description) != null,
  });
}

export interface ToastDescriptionState extends ToastRootState {}

export interface ToastDescriptionProps extends ZestUIComponentProps<typeof Text, ToastDescriptionState> {}

export namespace ToastDescription {
  export type State = ToastDescriptionState;
  export type Props = ToastDescriptionProps;
}

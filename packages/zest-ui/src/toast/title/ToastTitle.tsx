'use client';
import { Text } from 'react-native';
import { useToastRootContext } from '../root/ToastRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { ToastRootState } from '../root/ToastRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * A title that labels the toast.
 * Renders a `<Text>` with a heading role.
 *
 * Falls back to the toast's `title` when given no children.
 */
export function ToastTitle(componentProps: ToastTitle.Props) {
  const { render, className, style, children, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { toast, state, setTitleId } = useToastRootContext();

  const id = useId(idProp ?? undefined);

  useIsoLayoutEffect(() => {
    setTitleId(id);
    return () => setTitleId(undefined);
  }, [id, setTitleId]);

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [
      { nativeID: id, role: 'heading' as const, children: children ?? toast.title },
      elementProps,
    ],
    enabled: (children ?? toast.title) != null,
  });
}

export interface ToastTitleState extends ToastRootState {}

export interface ToastTitleProps extends ZestUIComponentProps<typeof Text, ToastTitleState> {}

export namespace ToastTitle {
  export type State = ToastTitleState;
  export type Props = ToastTitleProps;
}

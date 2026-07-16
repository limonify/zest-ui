'use client';
import { Text } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import type { ZestUIComponentProps } from '../../types';

/**
 * A heading that labels the dialog.
 * Renders a `<Text>` with a heading role.
 */
export function DialogTitle(componentProps: DialogTitle.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const store = useDialogRootContext();

  const id = useId(idProp ?? undefined);

  store.useSyncedValueWithCleanup('titleElementId', id);

  return useRenderElement(Text, componentProps, {
    ref,
    props: [{ nativeID: id, role: 'heading' as const }, elementProps],
  });
}

export interface DialogTitleProps extends ZestUIComponentProps<typeof Text, DialogTitleState> {}

export interface DialogTitleState {}

export namespace DialogTitle {
  export type Props = DialogTitleProps;
  export type State = DialogTitleState;
}

'use client';
import { Text } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import type { ZestUIComponentProps } from '../../types';

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<Text>`.
 */
export function DialogDescription(componentProps: DialogDescription.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const store = useDialogRootContext();

  const id = useId(idProp ?? undefined);

  store.useSyncedValueWithCleanup('descriptionElementId', id);

  return useRenderElement(Text, componentProps, {
    ref,
    props: [{ nativeID: id }, elementProps],
  });
}

export interface DialogDescriptionProps
  extends ZestUIComponentProps<typeof Text, DialogDescriptionState> {}

export interface DialogDescriptionState {}

export namespace DialogDescription {
  export type Props = DialogDescriptionProps;
  export type State = DialogDescriptionState;
}

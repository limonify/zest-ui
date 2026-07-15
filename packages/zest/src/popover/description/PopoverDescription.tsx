'use client';
import { Text } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import type { BaseUIComponentProps } from '../../types';

/**
 * A paragraph with additional information about the popover.
 * Renders a `<Text>`.
 */
export function PopoverDescription(componentProps: PopoverDescription.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const store = usePopoverRootContext();

  const id = useId(idProp ?? undefined);

  store.useSyncedValueWithCleanup('descriptionElementId', id);

  return useRenderElement(Text, componentProps, {
    ref,
    props: [{ nativeID: id }, elementProps],
  });
}

export interface PopoverDescriptionProps
  extends BaseUIComponentProps<typeof Text, PopoverDescriptionState> {}

export interface PopoverDescriptionState {}

export namespace PopoverDescription {
  export type Props = PopoverDescriptionProps;
  export type State = PopoverDescriptionState;
}

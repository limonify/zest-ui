'use client';
import { Text } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import type { BaseUIComponentProps } from '../../types';

/**
 * A heading that labels the popover.
 * Renders a `<Text>` with a heading role.
 */
export function PopoverTitle(componentProps: PopoverTitle.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const store = usePopoverRootContext();

  const id = useId(idProp ?? undefined);

  store.useSyncedValueWithCleanup('titleElementId', id);

  return useRenderElement(Text, componentProps, {
    ref,
    props: [{ nativeID: id, role: 'heading' as const }, elementProps],
  });
}

export interface PopoverTitleProps extends BaseUIComponentProps<typeof Text, PopoverTitleState> {}

export interface PopoverTitleState {}

export namespace PopoverTitle {
  export type Props = PopoverTitleProps;
  export type State = PopoverTitleState;
}

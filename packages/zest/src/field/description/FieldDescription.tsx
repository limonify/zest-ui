'use client';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useFieldRootContext } from '../root/FieldRootContext';
import type { FieldRoot } from '../root/FieldRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * A description for the field's control, announced alongside it.
 * Renders a `<Text>`.
 */
export function FieldDescription(componentProps: FieldDescription.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { setMessageIds, state } = useFieldRootContext();

  const id = useId(idProp ?? undefined);

  // Registers into the control's `accessibilityDescribedBy` list.
  useIsoLayoutEffect(() => {
    if (!id) {
      return undefined;
    }
    setMessageIds((previous) => previous.concat(id));
    return () => setMessageIds((previous) => previous.filter((item) => item !== id));
  }, [id, setMessageIds]);

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [{ nativeID: id }, elementProps],
  });
}

export interface FieldDescriptionState extends FieldRoot.State {}

export interface FieldDescriptionProps
  extends ZestUIComponentProps<typeof Text, FieldDescriptionState> {}

export namespace FieldDescription {
  export type State = FieldDescriptionState;
  export type Props = FieldDescriptionProps;
}

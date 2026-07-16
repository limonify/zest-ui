'use client';
import { Text } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import type { SliderRootState } from '../root/SliderRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * An accessible label that is automatically associated with the slider thumbs.
 * Renders a `<Text>`.
 *
 * Upstream also focuses a thumb when the label is pressed. React Native has no
 * programmatic focus for a `View`, and the thumb is `accessibilityRole="adjustable"`
 * already, so the association is expressed purely through `accessibilityLabelledBy`.
 */
export function SliderLabel(componentProps: SliderLabel.Props) {
  const { render, className, style, nativeID: idProp, ref, ...elementProps } = componentProps;

  const { setLabelId, state } = useSliderRootContext();

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

export interface SliderLabelState extends SliderRootState {}

export interface SliderLabelProps extends BaseUIComponentProps<typeof Text, SliderLabelState> {}

export namespace SliderLabel {
  export type State = SliderLabelState;
  export type Props = SliderLabelProps;
}

'use client';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import type { ZestUIComponentProps } from '../../types';

/**
 * A heading that labels the corresponding panel.
 * Renders a `<View>`.
 */
export function AccordionHeader(componentProps: AccordionHeader.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { state } = useAccordionItemContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ accessibilityRole: 'header' as const, role: 'heading' as const }, elementProps],
  });
}

export interface AccordionHeaderState extends AccordionItemState {}

export interface AccordionHeaderProps
  extends ZestUIComponentProps<typeof View, AccordionHeaderState> {}

export namespace AccordionHeader {
  export type State = AccordionHeaderState;
  export type Props = AccordionHeaderProps;
}

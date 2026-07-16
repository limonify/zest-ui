'use client';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * The area that opens the context menu when long-pressed.
 * Renders a `<Pressable>`.
 *
 * The long press records where it landed, and the menu's `Positioner` anchors
 * the popup to that point.
 */
export function ContextMenuTrigger(componentProps: ContextMenuTrigger.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useMenuRootContext();
  const { setAnchor } = useContextMenuRootContext();

  const open = store.useState('open');

  const state: ContextMenuTriggerState = { open };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        
        onLongPress(event: GestureResponderEvent) {
          const { pageX, pageY } = event.nativeEvent;
          setAnchor({ x: pageX, y: pageY });
          store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, event));
        },
        accessibilityHint: 'Long press for more actions',
      },
      elementProps,
    ],
  });
}

export interface ContextMenuTriggerState {
  /**
   * Whether the context menu is open.
   */
  open: boolean;
}

export interface ContextMenuTriggerProps
  extends ZestUIComponentProps<typeof Pressable, ContextMenuTriggerState> {}

export namespace ContextMenuTrigger {
  export type State = ContextMenuTriggerState;
  export type Props = ContextMenuTriggerProps;
}

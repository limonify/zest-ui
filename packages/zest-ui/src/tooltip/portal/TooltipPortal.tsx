'use client';
import * as React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { TooltipPortalContext } from './TooltipPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A portal element that moves the tooltip to the top of the app.
 *
 * Like the rest of the popup family this is React Native's `Modal`, which keeps
 * children in the same React tree (so contexts survive) and gives the popup a
 * screen-origin coordinate space for positioning.
 *
 * The portal also renders the dismissal surface: a tooltip has no backdrop part,
 * so a press anywhere outside the popup closes it.
 */
export function TooltipPortal(props: TooltipPortal.Props) {
  const { children, keepMounted = false } = props;

  const store = useTooltipRootContext();
  const open = store.useState('open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <TooltipPortalContext.Provider value={keepMounted}>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={(event: NativeSyntheticEvent<unknown>) => {
          store.setOpen(false, createChangeEventDetails(REASONS.escapeKey, event));
        }}
      >
        {/* A bare touch catcher rather than a Pressable: it is not a control,
            it just closes the tooltip. The popup claims the responder itself, so
            presses inside it never reach here. */}
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(event: GestureResponderEvent) => {
            store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
          }}
        />
        {children}
      </Modal>
    </TooltipPortalContext.Provider>
  );
}

export interface TooltipPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the tooltip is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace TooltipPortal {
  export type Props = TooltipPortalProps;
}

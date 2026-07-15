'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPortalContext } from './PopoverPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * Like `Dialog.Portal`, this is React Native's `Modal`. A state-lifting portal
 * host would drop the React context of the declaration site; `Modal` keeps its
 * children in the same React tree, so `Popover.Popup` still sees the root store.
 *
 * `statusBarTranslucent` matters for positioning: it makes the modal's origin
 * the top of the screen, which is the coordinate space `useAnchorPositioning`
 * resolves the anchor into.
 */
export function PopoverPortal(props: PopoverPortal.Props) {
  const { children, keepMounted = false } = props;

  const store = usePopoverRootContext();
  const open = store.useState('open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PopoverPortalContext.Provider value={keepMounted}>
      <Modal
        transparent
        visible={open}
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={(event: NativeSyntheticEvent<unknown>) => {
          store.setOpen(false, createChangeEventDetails(REASONS.escapeKey, event));
        }}
      >
        {children}
      </Modal>
    </PopoverPortalContext.Provider>
  );
}

export interface PopoverPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the popover is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace PopoverPortal {
  export type Props = PopoverPortalProps;
}

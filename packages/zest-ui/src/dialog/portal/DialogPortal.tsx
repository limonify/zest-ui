'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * Implemented with React Native's `Modal`, which mounts its children at the
 * root of the native view hierarchy, contains accessibility focus, and wires
 * the Android hardware back button (and Escape on web) to `onRequestClose`.
 * The Modal uses `animationType="fade"` so open/close get a smooth native
 * cross-fade (including the exit, which a consumer-driven animation can't cover
 * because the Modal unmounts on close). Consumers still layer their own
 * enter transitions (scale/slide) on the popup on top of this fade.
 */
export function DialogPortal(props: DialogPortal.Props) {
  const { children, keepMounted = false } = props;

  const store = useDialogRootContext();
  const open = store.useState('open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalContext.Provider value={keepMounted}>
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
        {children}
      </Modal>
    </DialogPortalContext.Provider>
  );
}

export interface DialogPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted (with the modal hidden) while the
   * dialog is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace DialogPortal {
  export type Props = DialogPortalProps;
}

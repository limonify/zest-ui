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
 * Rendering is headless: `animationType` is `"none"` so consumers own all
 * animation.
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
        animationType="none"
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

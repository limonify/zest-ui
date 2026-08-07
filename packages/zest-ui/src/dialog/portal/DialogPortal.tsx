'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestPortalModalProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * Implemented with React Native's `Modal`, which mounts its children at the
 * root of the native view hierarchy, contains accessibility focus, and wires
 * the Android hardware back button (and Escape on web) to `onRequestClose`.
 * The Modal uses `animationType="none"`: zest never animates anything, and a
 * native cross-fade the consumer did not ask for fights the enter/exit they
 * wrote — it tears the surface away mid-exit on close. Pass
 * `modalProps={{ animationType: 'fade' }}` for the native transition instead.
 */
export function DialogPortal(props: DialogPortal.Props) {
  const { children, keepMounted = false, modalProps } = props;

  const store = useDialogRootContext();
  const open = useStoreState(store, 'open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalContext.Provider value={keepMounted}>
      <Modal
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        {...modalProps}
        visible={open}
        onRequestClose={(event: NativeSyntheticEvent<unknown>) => {
          modalProps?.onRequestClose?.(event);
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
  /**
   * Props forwarded to the underlying React Native `Modal`. Lets you replace
   * the default `animationType="none"` with a native one, or reach `onShow`,
   * `supportedOrientations`
   * and the rest of the Modal API. `visible` stays owned by the dialog's open
   * state, and `onRequestClose` is chained rather than replaced.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace DialogPortal {
  export type Props = DialogPortalProps;
}

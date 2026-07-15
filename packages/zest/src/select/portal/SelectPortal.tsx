'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { SelectPortalContext } from './SelectPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * React Native's `Modal`, like the rest of the popup family.
 */
export function SelectPortal(props: SelectPortal.Props) {
  const { children, keepMounted = false } = props;

  const store = useSelectRootContext();
  const open = store.useState('open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <SelectPortalContext.Provider value={keepMounted}>
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
    </SelectPortalContext.Provider>
  );
}

export interface SelectPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the popup is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace SelectPortal {
  export type Props = SelectPortalProps;
}

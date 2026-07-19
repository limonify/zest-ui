'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';

/**
 * Moves the popup to the top of the app, as an RN `Modal` like the rest of the
 * popup family.
 */
export function ComboboxPortal(props: ComboboxPortal.Props) {
  const { children, keepMounted = false } = props;

  const { open, setOpen } = useComboboxRootContext();

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={(event: NativeSyntheticEvent<unknown>) => {
        setOpen(false, event);
      }}
    >
      {children}
    </Modal>
  );
}

export interface ComboboxPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the list is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ComboboxPortal {
  export type Props = ComboboxPortalProps;
}

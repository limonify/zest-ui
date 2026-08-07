'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { ComboboxPortalContext } from './ComboboxPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestPortalModalProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Moves the popup to the top of the app, as an RN `Modal` like the rest of the
 * popup family.
 */
export function ComboboxPortal(props: ComboboxPortal.Props) {
  const { children, keepMounted = false, modalProps } = props;

  const store = useComboboxRootContext();
  const open = useStoreState(store, 'open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <ComboboxPortalContext.Provider value={keepMounted}>
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
    </ComboboxPortalContext.Provider>
  );
}

export interface ComboboxPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the list is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * Props forwarded to the underlying React Native `Modal`. Lets you replace
   * the default `animationType="none"` with a native `"fade"`/`"slide"`, or reach
   * the rest of the Modal API.
   * `visible` stays owned by the combobox's open state, and `onRequestClose` is
   * chained rather than replaced.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace ComboboxPortal {
  export type Props = ComboboxPortalProps;
}

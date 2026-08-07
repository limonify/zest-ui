'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { SelectPortalContext } from './SelectPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestPortalModalProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';
import { PortalGestureRoot } from '../../internals/portal/PortalGestureRoot';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * React Native's `Modal`, like the rest of the popup family.
 */
export function SelectPortal(props: SelectPortal.Props) {
  const { children, keepMounted = false, modalProps } = props;

  const store = useSelectRootContext();
  const open = useStoreState(store, 'open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <SelectPortalContext.Provider value={keepMounted}>
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
        <PortalGestureRoot>{children}</PortalGestureRoot>
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
  /**
   * Props forwarded to the underlying React Native `Modal`. Lets you replace
   * the default `animationType="none"` with a native `"fade"`/`"slide"`, or reach
   * the rest of the Modal API.
   * `visible` stays owned by the select's open state, and `onRequestClose` is
   * chained rather than replaced.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace SelectPortal {
  export type Props = SelectPortalProps;
}

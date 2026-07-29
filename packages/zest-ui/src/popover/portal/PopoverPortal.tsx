'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPortalContext } from './PopoverPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestPortalModalProps } from '../../types';

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
  const { children, keepMounted = false, modalProps } = props;

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
        animationType="fade"
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
  /**
   * Props forwarded to the underlying React Native `Modal`. Lets you replace
   * the default `animationType="fade"`, or reach the rest of the Modal API.
   * `visible` stays owned by the popover's open state, and `onRequestClose` is
   * chained rather than replaced.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace PopoverPortal {
  export type Props = PopoverPortalProps;
}

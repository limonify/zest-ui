'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { ComboboxPortalContext } from './ComboboxPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestPortalModalProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';
import { PortalGestureRoot } from '../../internals/portal/PortalGestureRoot';

/**
 * Moves the popup to the top of the app, as an RN `Modal` like the rest of the
 * popup family — or, with `modal={false}`, as a plain full-screen overlay that
 * keeps the field behind it focused.
 */
export function ComboboxPortal(props: ComboboxPortal.Props) {
  const { children, keepMounted = false, modal = true, modalProps } = props;

  const store = useComboboxRootContext();
  const open = useStoreState(store, 'open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  // A non-Modal portal renders its children in a full-screen overlay instead of
  // a separate window. The overlay spans the screen (`absoluteFill`) and lets
  // touches through everywhere its children do not paint (`box-none`), so a
  // consumer's full-screen `Backdrop` still dismisses on an outside press while
  // the app underneath stays reachable once the popup is gone. `collapsable` is
  // off so a Fabric re-render updates the overlay in place rather than tearing
  // the native view down.
  if (!modal) {
    return (
      <ComboboxPortalContext.Provider value={keepMounted}>
        <GestureHandlerRootView style={overlayStyle} pointerEvents="box-none" collapsable={false}>
          {children}
        </GestureHandlerRootView>
      </ComboboxPortalContext.Provider>
    );
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
        <PortalGestureRoot>{children}</PortalGestureRoot>
      </Modal>
    </ComboboxPortalContext.Provider>
  );
}

// The overlay is drawn above the app it covers. `zIndex` is what makes that
// reliable on Android, where an absolutely-positioned sibling is stacked by
// declaration order alone unless one carries an explicit elevation.
const overlayStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1000,
};

export interface ComboboxPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the list is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * Whether to render the popup in a React Native `Modal`.
   *
   * A `Modal` presents in its own window, so opening a combobox or autocomplete
   * list steals first responder from the field behind it and dismisses the
   * keyboard — the field must be re-tapped after every keystroke. Set this to
   * `false` to render the popup in a plain full-screen overlay instead, which
   * keeps the input focused and the keyboard up.
   *
   * The overlay renders where the Portal is mounted, so render it somewhere it
   * can cover the screen (at the app root, not inside a clipped scroll view),
   * and gate the `Backdrop` on the open state the way the Modal's `visible`
   * used to.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * Props forwarded to the underlying React Native `Modal`. Lets you replace
   * the default `animationType="none"` with a native `"fade"`/`"slide"`, or reach
   * the rest of the Modal API.
   * `visible` stays owned by the combobox's open state, and `onRequestClose` is
   * chained rather than replaced. Ignored when `modal={false}`.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace ComboboxPortal {
  export type Props = ComboboxPortalProps;
}

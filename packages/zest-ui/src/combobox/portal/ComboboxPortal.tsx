'use client';
import * as React from 'react';
import { Modal, Platform, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { ComboboxPortalContext, ComboboxPortalModalContext } from './ComboboxPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { warn } from '../../utils/warn';
import { useTimeout } from '../../hooks/useTimeout';
import type { ZestPortalModalProps } from '../../types';
import type { ModalRequestCloseEventType } from '../../utils/reactNativeTypes';
import { useStoreState } from '../../store/ReactStore';
import { PortalGestureRoot } from '../../internals/portal/PortalGestureRoot';

// When Android fires a Modal's `onShow`, its window does not have input focus yet, so
// a focus() at that moment ends in "Ignoring showSoftInput() as view is not served":
// the caret appears and the keyboard does not. No event reports the window gaining
// focus, so this waits for it. Measured on an emulator only. If it is ever too short,
// the user taps the input, which is what they had to do without it.
const ANDROID_MODAL_FOCUS_DELAY = 100;

/**
 * Moves the popup to the top of the app, as an RN `Modal` like the rest of the
 * popup family — or, with `modal={false}`, as a plain full-screen overlay that
 * keeps the field behind it focused.
 */
export function ComboboxPortal(props: ComboboxPortal.Props) {
  const { children, keepMounted = false, modal = true, modalProps } = props;

  const store = useComboboxRootContext();
  const open = useStoreState(store, 'open');
  const focusTimeout = useTimeout();

  // A layout effect in the input has already recorded where it is by now. Only iOS
  // and Android are known to lose focus this way, so the web does not warn.
  React.useEffect(() => {
    if (open && modal && store.context.inputOutsidePortal && Platform.OS !== 'web') {
      warn(
        'A Combobox.Input outside Combobox.Portal loses focus when the list opens, because a Modal is a separate window, so the user cannot keep typing.',
        'Move the input into the popup with a Combobox.Trigger, or pass modal={false} to Combobox.Portal.',
      );
    }
  }, [open, modal, store]);

  React.useEffect(() => {
    if (!open) {
      focusTimeout.clear();
    }
  }, [open, focusTimeout]);

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
        onShow={(event: NativeSyntheticEvent<unknown>) => {
          modalProps?.onShow?.(event);
          if (!store.context.focusInputOnShow) {
            return;
          }

          const focusInput = () => store.select('inputRef')?.current?.focus();
          if (Platform.OS === 'android') {
            focusTimeout.start(ANDROID_MODAL_FOCUS_DELAY, focusInput);
          } else {
            focusInput();
          }
        }}
        onRequestClose={(event: ModalRequestCloseEventType) => {
          modalProps?.onRequestClose?.(event);
          store.setOpen(false, createChangeEventDetails(REASONS.escapeKey, event));
        }}
      >
        <ComboboxPortalModalContext.Provider value>
          <PortalGestureRoot>{children}</PortalGestureRoot>
        </ComboboxPortalModalContext.Provider>
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
   * `visible` stays owned by the combobox's open state, and `onRequestClose` and
   * `onShow` are chained rather than replaced. Ignored when `modal={false}`.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace ComboboxPortal {
  export type Props = ComboboxPortalProps;
}

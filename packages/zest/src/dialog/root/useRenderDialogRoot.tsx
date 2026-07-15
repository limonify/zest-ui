'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import { DialogStore } from '../store/DialogStore';
import type { DialogRootProps } from './DialogRoot';
import { DialogRootContext } from './DialogRootContext';

export type DialogRootMode = 'dialog' | 'alert-dialog';

/**
 * The shared Root implementation behind `Dialog.Root` and `AlertDialog.Root`.
 *
 * An alert dialog is a dialog that never dismisses on an outside press and
 * announces itself as `alertdialog`.
 */
export function useRenderDialogRoot<Payload = unknown>(
  props: DialogRootProps<Payload>,
  mode: DialogRootMode = 'dialog',
) {
  const {
    actionsRef,
    children,
    defaultOpen = false,
    defaultTriggerId = null,
    disablePointerDismissal: disablePointerDismissalProp = false,
    handle,
    onOpenChange,
    open,
    triggerId,
  } = props;

  const isAlertDialog = mode === 'alert-dialog';
  const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
  const role: 'dialog' | 'alertdialog' = isAlertDialog ? 'alertdialog' : 'dialog';

  const store = useRefWithInit(
    () =>
      new DialogStore({
        open: defaultOpen,
        openProp: open,
        disablePointerDismissal,
        role,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
      }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useControlledProp('triggerIdProp', triggerId);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useSyncedValues({ disablePointerDismissal, role });

  usePopupRootHandle({ store, handle, actionsRef });

  const payload = store.useState('payload') as Payload;

  return (
    <DialogRootContext.Provider value={store}>
      {typeof children === 'function' ? children(payload) : children}
    </DialogRootContext.Provider>
  );
}

'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
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
export function useRenderDialogRoot(props: DialogRootProps, mode: DialogRootMode = 'dialog') {
  const {
    children,
    defaultOpen = false,
    disablePointerDismissal: disablePointerDismissalProp = false,
    onOpenChange,
    open,
  } = props;

  const isAlertDialog = mode === 'alert-dialog';
  const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
  const role: 'dialog' | 'alertdialog' = isAlertDialog ? 'alertdialog' : 'dialog';

  const store = useRefWithInit(
    () => new DialogStore({ open: defaultOpen, openProp: open, disablePointerDismissal, role }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useSyncedValues({ disablePointerDismissal, role });

  return <DialogRootContext.Provider value={store}>{children}</DialogRootContext.Provider>;
}

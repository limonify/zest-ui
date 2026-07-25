'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import { useStableCallback } from '../../hooks/useStableCallback';
import { DialogStore } from '../store/DialogStore';
import type { DialogRootProps } from './DialogRoot';
import { DialogNestingContext, useDialogNestingContext } from './DialogNestingContext';
import { DialogRootContext } from './DialogRootContext';
import { DialogTransitionContext } from './DialogTransitionContext';

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

  const parent = useDialogNestingContext();
  const nested = parent !== undefined;

  const store = useRefWithInit(
    () =>
      new DialogStore({
        open: defaultOpen,
        openProp: open,
        disablePointerDismissal,
        role,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
        nested,
      }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useControlledProp('triggerIdProp', triggerId);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useSyncedValues({ disablePointerDismissal, role, nested });

  usePopupRootHandle({ store, handle, actionsRef });

  const resolvedOpen = store.useState('open');
  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  // Tell the dialog above this one whether it now has an open descendant. The
  // cleanup is what keeps the parent's count right when this root unmounts
  // while still open.
  React.useEffect(() => {
    if (parent === undefined || !resolvedOpen) {
      return undefined;
    }

    parent.onNestedOpenChange(true);

    return () => {
      parent.onNestedOpenChange(false);
    };
  }, [parent, resolvedOpen]);

  const onNestedOpenChange = useStableCallback((open: boolean) => {
    store.setNestedOpen(open);
    // A dialog two levels down is still nested inside this one's parent, so the
    // count propagates all the way up.
    parent?.onNestedOpenChange(open);
  });

  const payload = store.useState('payload') as Payload;

  const transitionContextValue = React.useMemo(
    () => ({ transitionStatus }),
    [transitionStatus],
  );

  const nestingContextValue = React.useMemo(
    () => ({ onNestedOpenChange }),
    [onNestedOpenChange],
  );

  return (
    <DialogRootContext.Provider value={store}>
      <DialogTransitionContext.Provider value={transitionContextValue}>
        <DialogNestingContext.Provider value={nestingContextValue}>
          {typeof children === 'function' ? children(payload) : children}
        </DialogNestingContext.Provider>
      </DialogTransitionContext.Provider>
    </DialogRootContext.Provider>
  );
}

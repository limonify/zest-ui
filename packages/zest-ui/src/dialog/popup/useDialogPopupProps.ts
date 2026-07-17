'use client';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogPortalContext } from '../portal/DialogPortalContext';

/**
 * The state and element props shared by every popup built on the dialog store —
 * `Dialog.Popup`, `AlertDialog.Popup` and `Drawer.Popup`.
 */
export function useDialogPopupProps() {
  useDialogPortalContext();
  const store = useDialogRootContext();

  const open = store.useState('open');
  const titleElementId = store.useState('titleElementId');
  const descriptionElementId = store.useState('descriptionElementId');
  const role = store.useState('role');

  return {
    store,
    open,
    props: {
      role,
      accessibilityViewIsModal: true,
      accessibilityLabelledBy: titleElementId,
      'aria-modal': true,
      'aria-labelledby': titleElementId,
      'aria-describedby': descriptionElementId,
      // Claim the touch responder so presses inside the popup never reach
      // the viewport's outside-press handler.
      onStartShouldSetResponder: () => true,
    },
  };
}

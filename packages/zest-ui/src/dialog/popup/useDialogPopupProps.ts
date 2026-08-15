'use client';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogPortalContext } from '../portal/DialogPortalContext';
import { useDialogTransitionContext } from '../root/DialogTransitionContext';
import { useStoreState } from '../../store/ReactStore';

/**
 * The state and element props shared by every popup built on the dialog store —
 * `Dialog.Popup`, `AlertDialog.Popup` and `Drawer.Popup`.
 */
export function useDialogPopupProps() {
  useDialogPortalContext();
  const store = useDialogRootContext();
  const transitionContext = useDialogTransitionContext();

  const open = useStoreState(store, 'open');
  const titleElementId = useStoreState(store, 'titleElementId');
  const descriptionElementId = useStoreState(store, 'descriptionElementId');
  const role = useStoreState(store, 'role');
  const nested = useStoreState(store, 'nested');
  const nestedDialogOpen = useStoreState(store, 'nestedDialogOpen');
  const nestedDialogCount = useStoreState(store, 'nestedDialogCount');

  return {
    store,
    open,
    nested,
    nestedDialogOpen,
    nestedDialogCount,
    transitionStatus: transitionContext?.transitionStatus,
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

import { DialogHandle } from '../dialog/store/DialogHandle';

/**
 * Controls an alert dialog imperatively, and associates `AlertDialog.Trigger`s
 * rendered outside the root with it.
 *
 * An alert dialog reuses the dialog store, so it reuses its handle too — only the
 * name in warnings differs.
 */
export type AlertDialogHandle<Payload = unknown> = DialogHandle<Payload>;

/**
 * Creates a handle that connects an `AlertDialog.Root` to triggers rendered
 * outside it, and controls it imperatively.
 */
export function createAlertDialogHandle<Payload = unknown>(): AlertDialogHandle<Payload> {
  return new DialogHandle<Payload>('AlertDialog');
}

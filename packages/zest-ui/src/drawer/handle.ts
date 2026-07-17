import { DialogHandle } from '../dialog/store/DialogHandle';

/**
 * Controls a drawer imperatively, and associates `Drawer.Trigger`s rendered
 * outside the root with it.
 *
 * A drawer reuses the dialog store, so it reuses its handle too — only the name
 * in warnings differs.
 */
export type DrawerHandle<Payload = unknown> = DialogHandle<Payload>;

/**
 * Creates a handle that connects a `Drawer.Root` to triggers rendered outside it,
 * and controls it imperatively.
 */
export function createDrawerHandle<Payload = unknown>(): DrawerHandle<Payload> {
  return new DialogHandle<Payload>('Drawer');
}

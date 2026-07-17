export { DrawerRoot as Root } from './root/DrawerRoot';
export { createDrawerHandle as createHandle } from './handle';
export { DrawerPopup as Popup } from './popup/DrawerPopup';
export { DrawerSwipeArea as SwipeArea } from './swipe-area/DrawerSwipeArea';

// A drawer is a dialog with a swipe gesture, so every part but the Root and the
// Popup is the dialog's own, unchanged — they read the same store.
export { DialogTrigger as Trigger } from '../dialog/trigger/DialogTrigger';
export { DialogPortal as Portal } from '../dialog/portal/DialogPortal';
export { DialogBackdrop as Backdrop } from '../dialog/backdrop/DialogBackdrop';
export { DialogViewport as Viewport } from '../dialog/viewport/DialogViewport';
export { DialogTitle as Title } from '../dialog/title/DialogTitle';
export { DialogDescription as Description } from '../dialog/description/DialogDescription';
export { DialogClose as Close } from '../dialog/close/DialogClose';

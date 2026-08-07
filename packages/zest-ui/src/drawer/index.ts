export * as Drawer from './index.parts';

export type * from './root/DrawerRoot';
export { createDrawerHandle, type DrawerHandle } from './handle';
export type * from './popup/DrawerPopup';
export type * from './provider/DrawerProvider';
export type * from './indent/DrawerIndent';
export type * from './indent-background/DrawerIndentBackground';
export { useDrawerProviderContext } from './provider/DrawerProviderContext';
export type * from './swipe-area/DrawerSwipeArea';
export {
  useDrawerRootContext,
  type DrawerSnapPoint,
  type DrawerSwipeDirection,
} from './root/DrawerRootContext';
export {
  useDrawerSnapPoints,
  type ResolvedDrawerSnapPoint,
} from './root/useDrawerSnapPoints';

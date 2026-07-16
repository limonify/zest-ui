'use client';
import * as React from 'react';
import { MenuRoot } from '../../menu/root/MenuRoot';
import { ContextMenuRootContext, type ContextMenuAnchorPoint } from './ContextMenuRootContext';

/**
 * Groups the parts of a context menu — a menu opened by long-pressing an area
 * rather than tapping a button.
 * Doesn't render its own element.
 *
 * A context menu is a `Menu.Root` anchored to the point where the long press
 * landed instead of to a trigger element. It reuses every menu part except the
 * trigger and positioner, which are its own.
 *
 * **Adapted from upstream.** The web version opens on right-click *or* long
 * press and tracks a virtual cursor; a touch screen only has the long press.
 */
export function ContextMenuRoot(props: ContextMenuRoot.Props) {
  const [anchor, setAnchor] = React.useState<ContextMenuAnchorPoint>({ x: 0, y: 0 });

  const contextValue: ContextMenuRootContext = React.useMemo(
    () => ({ anchor, setAnchor }),
    [anchor],
  );

  return (
    <ContextMenuRootContext.Provider value={contextValue}>
      <MenuRoot {...props} />
    </ContextMenuRootContext.Provider>
  );
}

export interface ContextMenuRootState {}

export interface ContextMenuRootProps
  extends Omit<
    MenuRoot.Props,
    'handle' | 'triggerId' | 'defaultTriggerId' | 'children'
  > {
  children?: React.ReactNode;
}

export namespace ContextMenuRoot {
  export type State = ContextMenuRootState;
  export type Props = ContextMenuRootProps;
}

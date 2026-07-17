'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { MenuPortalContext } from './MenuPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * React Native's `Modal`, like the rest of the popup family: it keeps children
 * in the same React tree and gives the popup a screen-origin coordinate space.
 * A submenu's Modal nests inside its parent's, which RN supports.
 */
export function MenuPortal(props: MenuPortal.Props) {
  const { children, keepMounted = false } = props;

  const store = useMenuRootContext();
  const submenuRootContext = useMenuSubmenuRootContext();
  const open = store.useState('open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <MenuPortalContext.Provider value={keepMounted}>
      <Modal
        transparent
        visible={open}
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={(event: NativeSyntheticEvent<unknown>) => {
          const eventDetails = createChangeEventDetails(REASONS.escapeKey, event);
          store.setOpen(false, eventDetails);

          // A submenu closes itself; `closeParentOnEsc` dismisses the whole menu
          // instead. A vetoed close must not take the parent down either.
          if (submenuRootContext?.closeParentOnEsc && !eventDetails.isCanceled) {
            submenuRootContext.parentMenu.setOpen(
              false,
              createChangeEventDetails(REASONS.escapeKey, event),
            );
          }
        }}
      >
        {children}
      </Modal>
    </MenuPortalContext.Provider>
  );
}

export interface MenuPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted while the menu is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace MenuPortal {
  export type Props = MenuPortalProps;
}

'use client';
import * as React from 'react';
import { Modal, type NativeSyntheticEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { MenuPortalContext } from './MenuPortalContext';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestPortalModalProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';
import { PortalGestureRoot } from '../../internals/portal/PortalGestureRoot';

/**
 * A portal element that moves the popup to the top of the app.
 *
 * React Native's `Modal`, like the rest of the popup family: it keeps children
 * in the same React tree and gives the popup a screen-origin coordinate space.
 * A submenu's Modal nests inside its parent's, which RN supports.
 */
export function MenuPortal(props: MenuPortal.Props) {
  const { children, keepMounted = false, modalProps } = props;

  const store = useMenuRootContext();
  const submenuRootContext = useMenuSubmenuRootContext();
  const open = useStoreState(store, 'open');

  const shouldRender = open || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <MenuPortalContext.Provider value={keepMounted}>
      <Modal
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        {...modalProps}
        visible={open}
        onRequestClose={(event: NativeSyntheticEvent<unknown>) => {
          modalProps?.onRequestClose?.(event);

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
        <PortalGestureRoot>{children}</PortalGestureRoot>
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
  /**
   * Props forwarded to the underlying React Native `Modal`. Lets you replace
   * the default `animationType="none"` with a native `"fade"`/`"slide"`, or reach
   * the rest of the Modal API.
   * `visible` stays owned by the menu's open state, and `onRequestClose` is
   * chained rather than replaced.
   */
  modalProps?: ZestPortalModalProps | undefined;
}

export namespace MenuPortal {
  export type Props = MenuPortalProps;
}

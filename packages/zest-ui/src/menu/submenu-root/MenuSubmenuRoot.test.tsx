import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Menu } from '../index';

function TestSubmenu(props: {
  closeParentOnEsc?: boolean;
  onItemPress?: () => void;
  onRootOpenChange?: (open: boolean, details: { reason: string; cancel: () => void }) => void;
  onSubOpenChange?: (open: boolean, details: { reason: string; cancel: () => void }) => void;
}) {
  const { closeParentOnEsc, onItemPress, onRootOpenChange, onSubOpenChange } = props;

  return (
    <Menu.Root defaultOpen onOpenChange={onRootOpenChange}>
      <Menu.Trigger testID="trigger">
        <Text>Open</Text>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup testID="popup">
            <Menu.Item testID="item-cut">
              <Text>Cut</Text>
            </Menu.Item>

            <Menu.SubmenuRoot closeParentOnEsc={closeParentOnEsc} onOpenChange={onSubOpenChange}>
              <Menu.SubmenuTrigger testID="submenu-trigger">
                <Text>Share</Text>
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup testID="submenu-popup">
                    <Menu.Item testID="submenu-item" onPress={onItemPress}>
                      <Text>Email</Text>
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Finds the Modals the portals rendered, so their onRequestClose can be fired. */
type TreeNode = { props?: Record<string, any>; children?: unknown[] };

let container: TreeNode;

/** Mirrors the other popup tests: walk `view.container` to reach host nodes. */
async function renderMenu(ui: React.ReactElement) {
  const view = await render(ui);
  container = view.container as unknown as TreeNode;
  return view;
}

function findAllByProp(node: TreeNode, propName: string, out: TreeNode[] = []): TreeNode[] {
  if (node.props && typeof node.props[propName] === 'function') {
    out.push(node);
  }
  for (const child of node.children ?? []) {
    if (typeof child === 'object' && child !== null) {
      findAllByProp(child as TreeNode, propName, out);
    }
  }
  return out;
}

describe('Menu submenus', () => {
  it('throws when SubmenuTrigger is used outside SubmenuRoot', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      render(
        <Menu.Root>
          <Menu.SubmenuTrigger />
        </Menu.Root>,
      ),
    ).rejects.toThrow(/must be placed within <Menu.SubmenuRoot>/);

    error.mockRestore();
  });

  it('keeps the submenu closed until its trigger is pressed', async () => {
    await renderMenu(<TestSubmenu />);

    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(screen.queryByTestId('submenu-popup')).toBeNull();
  });

  it('opens the submenu on press, leaving the parent open', async () => {
    const user = userEvent.setup();
    await renderMenu(<TestSubmenu />);

    await user.press(screen.getByTestId('submenu-trigger'));

    expect(screen.getByTestId('submenu-popup')).toBeTruthy();
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('renders the submenu in a Modal nested inside the parent menu', async () => {
    const user = userEvent.setup();
    await renderMenu(<TestSubmenu />);
    await user.press(screen.getByTestId('submenu-trigger'));

    // One Modal per open menu: the submenu's nests inside the parent's.
    const modals = findAllByProp(container, 'onRequestClose');
    expect(modals).toHaveLength(2);
  });

  it('toggles the submenu closed when its trigger is pressed again', async () => {
    const user = userEvent.setup();
    await renderMenu(<TestSubmenu />);

    await user.press(screen.getByTestId('submenu-trigger'));
    await user.press(screen.getByTestId('submenu-trigger'));

    expect(screen.queryByTestId('submenu-popup')).toBeNull();
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('reports the trigger-press reason to the submenu, not the parent', async () => {
    const user = userEvent.setup();
    const onRootOpenChange = jest.fn();
    const onSubOpenChange = jest.fn();
    await render(
      <TestSubmenu onRootOpenChange={onRootOpenChange} onSubOpenChange={onSubOpenChange} />,
    );

    await user.press(screen.getByTestId('submenu-trigger'));

    expect(onSubOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }));
    expect(onRootOpenChange).not.toHaveBeenCalled();
  });

  it('marks the trigger as expanded while the submenu is open', async () => {
    const user = userEvent.setup();
    await renderMenu(<TestSubmenu />);

    expect(screen.getByTestId('submenu-trigger').props.accessibilityState).toMatchObject({
      expanded: false,
    });

    await user.press(screen.getByTestId('submenu-trigger'));

    expect(screen.getByTestId('submenu-trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });
    expect(screen.getByTestId('submenu-trigger').props.accessibilityRole).toBe('menuitem');
  });

  describe('choosing a submenu item', () => {
    it('closes the whole menu, not just the submenu', async () => {
      const user = userEvent.setup();
      const onItemPress = jest.fn();
      await renderMenu(<TestSubmenu onItemPress={onItemPress} />);

      await user.press(screen.getByTestId('submenu-trigger'));
      await user.press(screen.getByTestId('submenu-item'));

      expect(onItemPress).toHaveBeenCalled();
      expect(screen.queryByTestId('submenu-popup')).toBeNull();
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('reports item-press to every menu it closes', async () => {
      const user = userEvent.setup();
      const onRootOpenChange = jest.fn();
      const onSubOpenChange = jest.fn();
      await render(
        <TestSubmenu onRootOpenChange={onRootOpenChange} onSubOpenChange={onSubOpenChange} />,
      );

      await user.press(screen.getByTestId('submenu-trigger'));
      await user.press(screen.getByTestId('submenu-item'));

      expect(onSubOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'item-press' }));
      expect(onRootOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'item-press' }));
    });

    it('lets the parent veto its own close without keeping the submenu open', async () => {
      const user = userEvent.setup();
      const onRootOpenChange = jest.fn((_open, eventDetails) => eventDetails.cancel());
      await renderMenu(<TestSubmenu onRootOpenChange={onRootOpenChange} />);

      await user.press(screen.getByTestId('submenu-trigger'));
      await user.press(screen.getByTestId('submenu-item'));

      // Each menu decides for itself: the submenu closed, the parent refused.
      expect(screen.queryByTestId('submenu-popup')).toBeNull();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('closeOnPress={false} leaves both menus open', async () => {
      const user = userEvent.setup();
      await renderMenu(
        <Menu.Root defaultOpen>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup testID="popup">
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger testID="submenu-trigger">
                    <Text>Share</Text>
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup testID="submenu-popup">
                        <Menu.Item testID="submenu-item" closeOnPress={false}>
                          <Text>Email</Text>
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      await user.press(screen.getByTestId('submenu-trigger'));
      await user.press(screen.getByTestId('submenu-item'));

      expect(screen.getByTestId('submenu-popup')).toBeTruthy();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });
  });

  describe('nested submenus', () => {
    it('closes every ancestor when a deep item is chosen', async () => {
      const user = userEvent.setup();

      await renderMenu(
        <Menu.Root defaultOpen>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup testID="popup">
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger testID="sub1-trigger">
                    <Text>More</Text>
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup testID="sub1-popup">
                        <Menu.SubmenuRoot>
                          <Menu.SubmenuTrigger testID="sub2-trigger">
                            <Text>Even more</Text>
                          </Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup testID="sub2-popup">
                                <Menu.Item testID="deep-item">
                                  <Text>Deep</Text>
                                </Menu.Item>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      await user.press(screen.getByTestId('sub1-trigger'));
      await user.press(screen.getByTestId('sub2-trigger'));
      expect(screen.getByTestId('sub2-popup')).toBeTruthy();

      await user.press(screen.getByTestId('deep-item'));

      expect(screen.queryByTestId('sub2-popup')).toBeNull();
      expect(screen.queryByTestId('sub1-popup')).toBeNull();
      expect(screen.queryByTestId('popup')).toBeNull();
    });
  });

  describe('closeParentOnEsc', () => {
    /** Fires the submenu Modal's onRequestClose (Android back / web Escape). */
    async function pressEscapeInSubmenu() {
      // The submenu's Modal is the inner, and therefore last, one found.
      const modals = findAllByProp(container, 'onRequestClose');
      const submenuModal = modals[modals.length - 1]!;

      await act(async () => {
        submenuModal.props!.onRequestClose({ nativeEvent: {} });
      });
    }

    it('closes only the submenu by default', async () => {
      const user = userEvent.setup();
      await renderMenu(<TestSubmenu />);
      await user.press(screen.getByTestId('submenu-trigger'));

      await pressEscapeInSubmenu();

      expect(screen.queryByTestId('submenu-popup')).toBeNull();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('closes the parent too when set', async () => {
      const user = userEvent.setup();
      await renderMenu(<TestSubmenu closeParentOnEsc />);
      await user.press(screen.getByTestId('submenu-trigger'));

      await pressEscapeInSubmenu();

      expect(screen.queryByTestId('submenu-popup')).toBeNull();
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('does not close the parent when the submenu vetoes its own close', async () => {
      const user = userEvent.setup();
      // Veto the close only; vetoing every change would stop it from opening.
      const onSubOpenChange = jest.fn((open, eventDetails) => {
        if (!open) {
          eventDetails.cancel();
        }
      });
      await renderMenu(<TestSubmenu closeParentOnEsc onSubOpenChange={onSubOpenChange} />);
      await user.press(screen.getByTestId('submenu-trigger'));

      await pressEscapeInSubmenu();

      expect(screen.getByTestId('submenu-popup')).toBeTruthy();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });
  });
});

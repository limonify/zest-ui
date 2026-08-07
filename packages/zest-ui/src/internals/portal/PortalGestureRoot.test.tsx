import * as React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AlertDialog, Combobox, Dialog, Drawer, Menu, Popover, Select, Tooltip } from '../../index';

/**
 * Every `Portal` must put a `PortalGestureRoot` inside its `Modal`.
 *
 * Jest cannot see what this is *for* — the bug is native: a `Modal` is its own
 * window, and without a gesture root inside it a touch on the popup is also
 * delivered to gesture handlers in the app underneath (tapping a `Select` row
 * over a `Slider` moved the slider). What a test can do is stop someone
 * deleting the wrapper, and that is all this claims to do.
 *
 * `GestureHandlerRootView` renders as a plain `View` under the jest mock, so it
 * cannot be found by type. It is identifiable by position and shape instead: the
 * Modal's only child, a `View` whose sole prop is `flex: 1`. Remove the wrapper
 * and the Modal's child becomes the backdrop or the positioner, which carry
 * other props, and these fail.
 */
type TreeNode = { type?: unknown; props?: Record<string, any>; children?: unknown[] };

function findModal(node: TreeNode): TreeNode | null {
  if (node.type === 'Modal') {
    return node;
  }
  for (const child of node.children ?? []) {
    if (typeof child === 'object' && child !== null) {
      const found = findModal(child as TreeNode);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function expectGestureRoot(container: unknown) {
  const modal = findModal(container as TreeNode);
  expect(modal).toBeTruthy();

  const children = (modal!.children ?? []) as TreeNode[];
  expect(children).toHaveLength(1);

  const root = children[0]!;
  expect(root.type).toBe('View');
  expect(root.props?.style).toEqual({ flex: 1 });
  expect(Object.keys(root.props ?? {}).sort()).toEqual(['children', 'style']);
}

describe('every Portal wraps its children in a gesture root', () => {
  it('Dialog', async () => {
    const view = await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup testID="popup" />
        </Dialog.Portal>
      </Dialog.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('AlertDialog', async () => {
    const view = await render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup testID="popup" />
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('Drawer, whose own swipe gesture lives inside the modal', async () => {
    const view = await render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup testID="popup" />
        </Drawer.Portal>
      </Drawer.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('Popover', async () => {
    const view = await render(
      <Popover.Root defaultOpen>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup testID="popup" />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('Menu', async () => {
    const view = await render(
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup testID="popup" />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('Select', async () => {
    const view = await render(
      <Select.Root defaultOpen>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup testID="popup" />
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('Combobox', async () => {
    const view = await render(
      <Combobox.Root items={['Apple']} defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup testID="popup" />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expectGestureRoot(view.container);
  });

  it('Tooltip', async () => {
    const view = await render(
      <Tooltip.Root defaultOpen>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup testID="popup">
              <Text>Hint</Text>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    expectGestureRoot(view.container);
  });
});

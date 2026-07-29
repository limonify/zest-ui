import * as React from 'react';
import { Text, View } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AlertDialog, Drawer } from '../../index';

// `Drawer.Popup` renders a `GestureDetector`, which throws unless it is under a
// `GestureHandlerRootView` — in tests as much as in an app.
function Gestures({ children }: { children: React.ReactNode }) {
  return <GestureHandlerRootView>{children}</GestureHandlerRootView>;
}

/**
 * `AlertDialog` and `Drawer` reuse the dialog store, so they reuse `DialogHandle`
 * too — only the name in warnings differs. That reuse is exactly why it is worth
 * asserting: nothing else proves the two shims wired the right component name, or
 * that the dialog handle drives their roots at all.
 *
 * `Dialog` itself is covered in `dialog/store/DialogHandle.test.tsx`.
 */

type Family = {
  name: string;
  componentName: string;
  createHandle: () => any;
  render: (handle: any) => React.ReactElement;
  renderWithTrigger: (handle: any) => React.ReactElement;
  renderWithPayload: (handle: any) => React.ReactElement;
};

const FAMILIES: Family[] = [
  {
    name: 'AlertDialog',
    componentName: 'AlertDialog',
    createHandle: () => AlertDialog.createHandle(),
    render: (handle) => (
      <AlertDialog.Root handle={handle}>
        <AlertDialog.Portal>
          <AlertDialog.Viewport>
            <AlertDialog.Popup testID="popup" />
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ),
    renderWithTrigger: (handle) => (
      <View>
        <AlertDialog.Trigger handle={handle} testID="trigger">
          <Text>Open</Text>
        </AlertDialog.Trigger>
        <AlertDialog.Root handle={handle}>
          <AlertDialog.Portal>
            <AlertDialog.Viewport>
              <AlertDialog.Popup testID="popup" />
            </AlertDialog.Viewport>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </View>
    ),
    renderWithPayload: (handle) => (
      <AlertDialog.Root handle={handle}>
        {(payload: { name: string } | undefined) => (
          <AlertDialog.Portal>
            <AlertDialog.Viewport>
              <AlertDialog.Popup testID="popup">
                <AlertDialog.Title testID="title">{payload?.name}</AlertDialog.Title>
              </AlertDialog.Popup>
            </AlertDialog.Viewport>
          </AlertDialog.Portal>
        )}
      </AlertDialog.Root>
    ),
  },
  {
    name: 'Drawer',
    componentName: 'Drawer',
    createHandle: () => Drawer.createHandle(),
    render: (handle) => (
      <Gestures>
        <Drawer.Root handle={handle}>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup testID="popup" />
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Gestures>
    ),
    renderWithTrigger: (handle) => (
      <Gestures>
        <View>
          <Drawer.Trigger handle={handle} testID="trigger">
            <Text>Open</Text>
          </Drawer.Trigger>
          <Drawer.Root handle={handle}>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup testID="popup" />
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        </View>
      </Gestures>
    ),
    renderWithPayload: (handle) => (
      <Gestures>
        <Drawer.Root handle={handle}>
          {(payload: { name: string } | undefined) => (
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup testID="popup">
                  <Drawer.Title testID="title">{payload?.name}</Drawer.Title>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          )}
        </Drawer.Root>
      </Gestures>
    ),
  },
];

describe.each(FAMILIES)('$name handle', (family) => {
  it('opens and closes the root imperatively', async () => {
    const handle = family.createHandle();
    await render(family.render(handle));

    expect(screen.queryByTestId('popup')).toBeNull();

    await act(async () => {
      handle.open();
    });
    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(handle.isOpen).toBe(true);

    await act(async () => {
      handle.close();
    });
    expect(screen.queryByTestId('popup')).toBeNull();
    expect(handle.isOpen).toBe(false);
  });

  it('opens from a trigger rendered outside the root', async () => {
    const user = userEvent.setup();
    const handle = family.createHandle();
    await render(family.renderWithTrigger(handle));

    expect(screen.queryByTestId('popup')).toBeNull();

    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('carries a payload to the root children', async () => {
    const handle = family.createHandle();
    await render(family.renderWithPayload(handle));

    await act(async () => {
      handle.openWithPayload({ name: 'Zest' });
    });

    expect(screen.getByTestId('title')).toHaveTextContent('Zest');
  });

  // Unlike the anchored families, an unanchored popup has nothing to anchor to,
  // so an unknown trigger id is a warning and the popup still opens.
  it('warns but still opens when given an unknown trigger id', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = family.createHandle();

    try {
      await render(family.render(handle));

      await act(async () => {
        handle.open('nope');
      });

      expect(screen.getByTestId('popup')).toBeTruthy();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('No trigger found with id "nope"'));
    } finally {
      warn.mockRestore();
    }
  });

  it('drops openWithPayload, and warns, while no root is mounted', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = family.createHandle();

    try {
      await act(async () => {
        handle.openWithPayload({ name: 'Zest' });
      });

      expect(handle.isOpen).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('openWithPayload() was called while no root'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('names itself in the warning it emits while unattached', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = family.createHandle();

    try {
      await act(async () => {
        handle.open();
      });

      // The shims exist to give each family its own name here.
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`${family.componentName}Handle.open()`),
      );
      expect(handle.isOpen).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });
});

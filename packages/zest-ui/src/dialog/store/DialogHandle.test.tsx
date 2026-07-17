import * as React from 'react';
import { Text, View } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Dialog, Popover, createDialogHandle, createPopoverHandle } from '../../index';
import type { DialogRoot } from '../root/DialogRoot';

describe('Dialog handles', () => {
  it('opens a root from a trigger rendered outside it', async () => {
    const user = userEvent.setup();
    const handle = createDialogHandle();

    await render(
      <View>
        {/* The trigger is not inside the root; only the handle connects them. */}
        <Dialog.Trigger handle={handle} testID="trigger">
          <Text>Open</Text>
        </Dialog.Trigger>

        <Dialog.Root handle={handle}>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Popup testID="popup" />
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </View>,
    );

    expect(screen.queryByTestId('popup')).toBeNull();

    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('reflects the open state on a detached trigger', async () => {
    const user = userEvent.setup();
    const handle = createDialogHandle();

    await render(
      <View>
        <Dialog.Trigger handle={handle} testID="trigger">
          <Text>Open</Text>
        </Dialog.Trigger>
        <Dialog.Root handle={handle}>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Popup testID="popup">
                <Dialog.Close testID="close">
                  <Text>Close</Text>
                </Dialog.Close>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </View>,
    );

    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: false,
    });

    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });

  describe('imperative control', () => {
    function TestDialog({ handle }: { handle: ReturnType<typeof createDialogHandle> }) {
      return (
        <Dialog.Root handle={handle}>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Popup testID="popup" />
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }

    it('open() and close() drive the root', async () => {
      const handle = createDialogHandle();
      await render(<TestDialog handle={handle} />);

      await act(async () => {
        handle.open();
      });
      expect(screen.getByTestId('popup')).toBeTruthy();

      await act(async () => {
        handle.close();
      });
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('reports the imperative-action reason', async () => {
      const onOpenChange = jest.fn();
      const handle = createDialogHandle();

      await render(
        <Dialog.Root handle={handle} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Popup testID="popup" />
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await act(async () => {
        handle.open();
      });

      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'imperative-action' }),
      );
    });

    it('isOpen tracks the attached root', async () => {
      const handle = createDialogHandle();
      await render(<TestDialog handle={handle} />);

      expect(handle.isOpen).toBe(false);

      await act(async () => {
        handle.open();
      });

      expect(handle.isOpen).toBe(true);
    });

    it('is inert, and warns, while no root is mounted', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = createDialogHandle();

      try {
        await act(async () => {
          handle.open();
        });

        expect(handle.isOpen).toBe(false);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('no root using this handle is mounted'));
      } finally {
        warn.mockRestore();
      }
    });

    it('goes inert again once the root unmounts', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = createDialogHandle();

      try {
        const view = await render(<TestDialog handle={handle} />);
        await view.rerender(<View />);

        await act(async () => {
          handle.open();
        });

        expect(handle.isOpen).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe('payloads', () => {
    it('hands a trigger payload to the root children', async () => {
      const user = userEvent.setup();
      const handle = createDialogHandle<{ name: string }>();

      await render(
        <View>
          <Dialog.Trigger handle={handle} payload={{ name: 'Eren' }} testID="trigger">
            <Text>Open</Text>
          </Dialog.Trigger>
          <Dialog.Root handle={handle}>
            {(payload) => (
              <Dialog.Portal>
                <Dialog.Viewport>
                  <Dialog.Popup testID="popup">
                    <Dialog.Title testID="title">{payload?.name}</Dialog.Title>
                  </Dialog.Popup>
                </Dialog.Viewport>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </View>,
      );

      await user.press(screen.getByTestId('trigger'));

      expect(screen.getByTestId('title')).toHaveTextContent('Eren');
    });

    it('openWithPayload opens and carries the payload', async () => {
      const handle = createDialogHandle<{ name: string }>();

      await render(
        <Dialog.Root handle={handle}>
          {(payload) => (
            <Dialog.Portal>
              <Dialog.Viewport>
                <Dialog.Popup testID="popup">
                  <Dialog.Title testID="title">{payload?.name}</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Viewport>
            </Dialog.Portal>
          )}
        </Dialog.Root>,
      );

      await act(async () => {
        handle.openWithPayload({ name: 'Zest' });
      });

      expect(screen.getByTestId('title')).toHaveTextContent('Zest');
    });
  });

  describe('actionsRef', () => {
    it('close() reports the imperative-action reason', async () => {
      const onOpenChange = jest.fn();
      const actionsRef = React.createRef<DialogRoot.Actions | null>();

      await render(
        <Dialog.Root defaultOpen actionsRef={actionsRef} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Popup testID="popup" />
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await act(async () => {
        actionsRef.current!.close();
      });

      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'imperative-action' }),
      );
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('unmount() closes without firing onOpenChange', async () => {
      const onOpenChange = jest.fn();
      const actionsRef = React.createRef<DialogRoot.Actions | null>();

      await render(
        <Dialog.Root defaultOpen actionsRef={actionsRef} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Popup testID="popup" />
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await act(async () => {
        actionsRef.current!.unmount();
      });

      // The consumer already knows it closed — they animated it — so telling them
      // again would be a second, spurious close.
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId('popup')).toBeNull();
    });
  });
});

describe('Popover handles', () => {
  it('anchors an imperatively opened popover to the named trigger', async () => {
    const handle = createPopoverHandle();

    await render(
      <View>
        <Popover.Trigger handle={handle} nativeID="settings" testID="trigger">
          <Text>Settings</Text>
        </Popover.Trigger>
        <Popover.Root handle={handle}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup testID="popup" />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </View>,
    );

    await act(async () => {
      handle.open('settings');
    });

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('throws when opened by an unknown trigger id', async () => {
    const handle = createPopoverHandle();

    await render(
      <Popover.Root handle={handle}>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup testID="popup" />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    // An anchored popup with no trigger to anchor to is a bug, not a warning —
    // unlike a Dialog, which is not anchored.
    await expect(
      act(async () => {
        handle.open('nope');
      }),
    ).rejects.toThrow(/no matching trigger is registered/);
  });
});

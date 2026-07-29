import * as React from 'react';
import { Text, View } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Menu, Popover } from '../../index';

/**
 * The machinery `BasePopupHandle` owns, independent of any one family: the stack
 * of attached roots, the store swap detached triggers follow, and trigger
 * resolution across that stack.
 *
 * A handle is meant for a single mounted root, but roots can overlap transiently
 * — an animated screen transition mounts the incoming one before the outgoing one
 * unmounts. The stack is what keeps the still-mounted root controllable when the
 * newer one detaches first.
 */

function MenuWithHandle({ handle, testID }: { handle: any; testID: string }) {
  return (
    <Menu.Root handle={handle}>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup testID={testID} />
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

describe('BasePopupHandle attachment', () => {
  it('drives the most recently mounted root when two overlap', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = Menu.createHandle();

    try {
      await render(
        <View>
          <Menu.Trigger handle={handle} nativeID="anchor" testID="trigger">
            <Text>Open</Text>
          </Menu.Trigger>
          <MenuWithHandle handle={handle} testID="first" />
          <MenuWithHandle handle={handle} testID="second" />
        </View>,
      );

      await act(async () => {
        handle.open('anchor');
      });

      // The newer root takes over; the older one is no longer controlled.
      expect(screen.getByTestId('second')).toBeTruthy();
      expect(screen.queryByTestId('first')).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('warns once the overlap is still there a frame later', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = Menu.createHandle();

    try {
      await render(
        <View>
          <MenuWithHandle handle={handle} testID="first" />
          <MenuWithHandle handle={handle} testID="second" />
        </View>,
      );

      // The warning is deferred a frame so a clean handoff stays quiet.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('attached to more than one mounted root'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('stays quiet when one root hands over to another', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = Menu.createHandle();

    try {
      const view = await render(<MenuWithHandle handle={handle} testID="first" />);
      // The outgoing root unmounts in the same commit the incoming one mounts.
      await view.rerender(<MenuWithHandle handle={handle} testID="second" />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('attached to more than one mounted root'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('restores the earlier root when the newer one unmounts first', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = Menu.createHandle();

    function Both({ showSecond }: { showSecond: boolean }) {
      return (
        <View>
          <Menu.Trigger handle={handle} nativeID="anchor" testID="trigger">
            <Text>Open</Text>
          </Menu.Trigger>
          <MenuWithHandle handle={handle} testID="first" />
          {showSecond ? <MenuWithHandle handle={handle} testID="second" /> : null}
        </View>
      );
    }

    try {
      const view = await render(<Both showSecond />);
      await view.rerender(<Both showSecond={false} />);

      await act(async () => {
        handle.open('anchor');
      });

      // Control fell back to the root that is still mounted, rather than
      // detaching and leaving the handle inert.
      expect(screen.getByTestId('first')).toBeTruthy();
      expect(handle.isOpen).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  it('lets a detached trigger register before any root mounts', async () => {
    const handle = Popover.createHandle();

    // The trigger renders against the handle's inert fallback store, then
    // migrates when a root attaches. Without that, opening by id right after the
    // root mounts could not resolve it.
    const view = await render(
      <Popover.Trigger handle={handle} nativeID="anchor" testID="trigger">
        <Text>Open</Text>
      </Popover.Trigger>,
    );

    expect(screen.getByTestId('trigger')).toBeTruthy();

    await view.rerender(
      <View>
        <Popover.Trigger handle={handle} nativeID="anchor" testID="trigger">
          <Text>Open</Text>
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
      handle.open('anchor');
    });

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('resolves a trigger that has not migrated to the new root yet', async () => {
    const handle = Menu.createHandle();

    // Two roots, trigger registered against the first: `openByTrigger` searches
    // the whole stack (newest first) and then the fallback, so the id still
    // resolves in the commit where a root attaches.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <View>
          <Menu.Trigger handle={handle} nativeID="anchor" testID="trigger">
            <Text>Open</Text>
          </Menu.Trigger>
          <MenuWithHandle handle={handle} testID="first" />
          <MenuWithHandle handle={handle} testID="second" />
        </View>,
      );

      await expect(
        act(async () => {
          handle.open('anchor');
        }),
      ).resolves.not.toThrow();

      expect(handle.isOpen).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });
});

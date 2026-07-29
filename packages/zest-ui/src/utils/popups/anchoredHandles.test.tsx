import * as React from 'react';
import { Text, View } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Autocomplete, Combobox, Menu, Popover, Select } from '../../index';

/**
 * The anchored half of the handle family: Popover, Menu, Select, Combobox and
 * Autocomplete. Each anchors its popup to a trigger, so `open(triggerId)` must
 * resolve a registered trigger — and **throws** when it cannot, unlike the
 * unanchored Dialog family, which only warns.
 *
 * Only `Dialog` had handle tests before this file; the anchored families are
 * where the trigger association actually matters, since without it an imperative
 * open anchors to whatever was pressed last.
 */

type Family = {
  name: string;
  /** Root + popup, with a detached trigger carrying the same handle. */
  render: (handle: any, triggerId: string) => React.ReactElement;
  /** Root + popup only — no trigger anywhere. */
  renderWithoutTrigger: (handle: any) => React.ReactElement;
  createHandle: () => any;
};

const FAMILIES: Family[] = [
  {
    name: 'Popover',
    createHandle: () => Popover.createHandle(),
    render: (handle, triggerId) => (
      <View>
        <Popover.Trigger handle={handle} nativeID={triggerId} testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Root handle={handle}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup testID="popup" />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </View>
    ),
    renderWithoutTrigger: (handle) => (
      <Popover.Root handle={handle}>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup testID="popup" />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ),
  },
  {
    name: 'Menu',
    createHandle: () => Menu.createHandle(),
    render: (handle, triggerId) => (
      <View>
        <Menu.Trigger handle={handle} nativeID={triggerId} testID="trigger">
          <Text>Open</Text>
        </Menu.Trigger>
        <Menu.Root handle={handle}>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup testID="popup" />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </View>
    ),
    renderWithoutTrigger: (handle) => (
      <Menu.Root handle={handle}>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup testID="popup" />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ),
  },
  {
    name: 'Select',
    createHandle: () => Select.createHandle(),
    render: (handle, triggerId) => (
      <View>
        <Select.Trigger handle={handle} nativeID={triggerId} testID="trigger">
          <Text>Open</Text>
        </Select.Trigger>
        <Select.Root handle={handle}>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup testID="popup" />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </View>
    ),
    renderWithoutTrigger: (handle) => (
      <Select.Root handle={handle}>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup testID="popup" />
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
  },
  {
    name: 'Combobox',
    createHandle: () => Combobox.createHandle(),
    render: (handle, triggerId) => (
      <View>
        <Combobox.Input handle={handle} nativeID={triggerId} testID="trigger" />
        <Combobox.Root handle={handle}>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup testID="popup" />
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </View>
    ),
    renderWithoutTrigger: (handle) => (
      <Combobox.Root handle={handle}>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup testID="popup" />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
  {
    name: 'Autocomplete',
    createHandle: () => Autocomplete.createHandle(),
    render: (handle, triggerId) => (
      <View>
        <Autocomplete.Input handle={handle} nativeID={triggerId} testID="trigger" />
        <Autocomplete.Root handle={handle}>
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup testID="popup" />
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </View>
    ),
    renderWithoutTrigger: (handle) => (
      <Autocomplete.Root handle={handle}>
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup testID="popup" />
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    ),
  },
];

describe.each(FAMILIES)('$name handle', (family) => {
  it('opens the root imperatively, anchored to a detached trigger', async () => {
    const handle = family.createHandle();
    await render(family.render(handle, 'anchor'));

    expect(screen.queryByTestId('popup')).toBeNull();

    await act(async () => {
      handle.open('anchor');
    });

    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(handle.isOpen).toBe(true);
  });

  it('closes the root imperatively', async () => {
    const handle = family.createHandle();
    await render(family.render(handle, 'anchor'));

    await act(async () => {
      handle.open('anchor');
    });
    await act(async () => {
      handle.close();
    });

    expect(screen.queryByTestId('popup')).toBeNull();
    expect(handle.isOpen).toBe(false);
  });

  // An anchored popup with no trigger to anchor to is a bug, not a warning: it
  // would otherwise open pinned to whatever was measured last.
  it('throws when opened with an unknown trigger id', async () => {
    const handle = family.createHandle();
    await render(family.renderWithoutTrigger(handle));

    await expect(
      act(async () => {
        handle.open('nope');
      }),
    ).rejects.toThrow(/no matching trigger is registered/);
  });

  it('is inert, and warns, while no root is mounted', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = family.createHandle();

    try {
      await act(async () => {
        handle.open('anchor');
      });

      expect(handle.isOpen).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('no root using this handle is mounted'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('warns when closed while no root is mounted', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = family.createHandle();

    try {
      await act(async () => {
        handle.close();
      });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('close() was called'));
    } finally {
      warn.mockRestore();
    }
  });

  it('goes inert again once the root unmounts', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = family.createHandle();

    try {
      const view = await render(family.render(handle, 'anchor'));
      await view.rerender(<View />);

      await act(async () => {
        handle.open('anchor');
      });

      expect(handle.isOpen).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('anchored trigger association', () => {
  it('reflects the open state on a detached Menu trigger', async () => {
    const user = userEvent.setup();
    const handle = Menu.createHandle();

    await render(
      <View>
        <Menu.Trigger handle={handle} nativeID="anchor" testID="trigger">
          <Text>Open</Text>
        </Menu.Trigger>
        <Menu.Root handle={handle}>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup testID="popup" />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </View>,
    );

    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: false,
    });

    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });

  it('reports the imperative-action reason on the root', async () => {
    const onOpenChange = jest.fn();
    const handle = Select.createHandle();

    await render(
      <View>
        <Select.Trigger handle={handle} nativeID="anchor" testID="trigger">
          <Text>Open</Text>
        </Select.Trigger>
        <Select.Root handle={handle} onOpenChange={onOpenChange}>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup testID="popup" />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </View>,
    );

    await act(async () => {
      handle.open('anchor');
    });

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'imperative-action' }),
    );
  });
});

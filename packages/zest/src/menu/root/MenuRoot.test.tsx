import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Menu } from '../index';

function TestMenu(props: React.ComponentProps<typeof Menu.Root> & { onSelect?: () => void }) {
  const { onSelect, ...rootProps } = props;

  return (
    <Menu.Root {...rootProps}>
      <Menu.Trigger testID="trigger">
        <Text>Actions</Text>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Backdrop testID="backdrop" />
        <Menu.Positioner testID="positioner">
          <Menu.Popup testID="popup">
            <Menu.Group testID="group">
              <Menu.GroupLabel testID="group-label">Editing</Menu.GroupLabel>
              <Menu.Item testID="item-copy" onPress={onSelect}>
                <Text>Copy</Text>
              </Menu.Item>
              <Menu.Item testID="item-paste" disabled>
                <Text>Paste</Text>
              </Menu.Item>
            </Menu.Group>
            <Menu.Separator testID="separator" />
            <Menu.Item testID="item-stay" closeOnClick={false}>
              <Text>Stay open</Text>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

describe('Menu', () => {
  it('opens via the Trigger and closes when an item is pressed', async () => {
    const onOpenChange = jest.fn();
    const onSelect = jest.fn();
    await render(<TestMenu onOpenChange={onOpenChange} onSelect={onSelect} />);

    expect(screen.queryByTestId('popup')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();

    await user.press(screen.getByTestId('item-copy'));

    expect(onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'item-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('keeps the menu open when the item sets closeOnClick to false', async () => {
    const onOpenChange = jest.fn();
    await render(<TestMenu defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-stay'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('ignores presses on a disabled item', async () => {
    const onOpenChange = jest.fn();
    await render(<TestMenu defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-paste'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('item-paste').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('closes on an outside press via the Backdrop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestMenu defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
  });

  it('does not dismiss on an outside press when disablePointerDismissal is set', async () => {
    await render(<TestMenu defaultOpen disablePointerDismissal />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('respects the controlled open prop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestMenu open={false} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('wires menu accessibility semantics', async () => {
    await render(<TestMenu defaultOpen />);

    expect(screen.getByTestId('trigger').props['aria-haspopup']).toBe('menu');
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });
    expect(screen.getByTestId('popup').props.accessibilityRole).toBe('menu');
    expect(screen.getByTestId('item-copy').props.accessibilityRole).toBe('menuitem');

    const group = screen.getByTestId('group');
    const groupLabel = screen.getByTestId('group-label');
    expect(group.props.role).toBe('group');
    expect(groupLabel.props.nativeID).toBeTruthy();
    expect(group.props.accessibilityLabelledBy).toBe(groupLabel.props.nativeID);
  });

  it('indexes its items in visual order', async () => {
    const styleFn = jest.fn(() => ({}));
    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger testID="trigger">
          <Text>Actions</Text>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup testID="popup">
              <Menu.Item testID="first">
                <Text>First</Text>
              </Menu.Item>
              <Menu.Item testID="second" style={styleFn}>
                <Text>Second</Text>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
  });
});

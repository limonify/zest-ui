import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Menu } from '../index';

const hidden = { includeHiddenElements: true } as const;

function TestCheckboxMenu(props: React.ComponentProps<typeof Menu.CheckboxItem>) {
  return (
    <Menu.Root defaultOpen>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup testID="popup">
            <Menu.CheckboxItem testID="item" {...props}>
              <Menu.CheckboxItemIndicator testID="indicator">
                <Text>✓</Text>
              </Menu.CheckboxItemIndicator>
              <Text>Show gridlines</Text>
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function TestRadioMenu(
  props: React.ComponentProps<typeof Menu.RadioGroup> & { itemDisabled?: boolean },
) {
  const { itemDisabled, ...groupProps } = props;

  return (
    <Menu.Root defaultOpen>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup testID="popup">
            <Menu.RadioGroup testID="group" {...groupProps}>
              {['sm', 'md', 'lg'].map((size) => (
                <Menu.RadioItem key={size} testID={`item-${size}`} value={size} disabled={itemDisabled}>
                  <Menu.RadioItemIndicator testID={`indicator-${size}`}>
                    <Text>•</Text>
                  </Menu.RadioItemIndicator>
                  <Text>{size}</Text>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

describe('Menu.CheckboxItem', () => {
  it('throws when the indicator is used outside a CheckboxItem', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Menu.CheckboxItemIndicator />)).rejects.toThrow(
      /must be placed within <Menu.CheckboxItem>/,
    );

    error.mockRestore();
  });

  it('is unticked by default and shows no indicator', async () => {
    await render(<TestCheckboxMenu />);

    expect(screen.getByTestId('item').props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.queryByTestId('indicator', hidden)).toBeNull();
  });

  it('ticks on press and shows the indicator', async () => {
    const user = userEvent.setup();
    await render(<TestCheckboxMenu />);

    await user.press(screen.getByTestId('item'));

    expect(screen.getByTestId('item').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('indicator', hidden)).toBeTruthy();
  });

  it('honours defaultChecked', async () => {
    await render(<TestCheckboxMenu defaultChecked />);

    expect(screen.getByTestId('item').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('reports the change with the item-press reason', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    await render(<TestCheckboxMenu onCheckedChange={onCheckedChange} />);

    await user.press(screen.getByTestId('item'));

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'item-press' }));
  });

  it('holds a controlled value the consumer does not change', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    await render(<TestCheckboxMenu checked={false} onCheckedChange={onCheckedChange} />);

    await user.press(screen.getByTestId('item'));

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.getByTestId('item').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('lets onCheckedChange cancel the change', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn((_checked, eventDetails) => eventDetails.cancel());
    await render(<TestCheckboxMenu onCheckedChange={onCheckedChange} />);

    await user.press(screen.getByTestId('item'));

    expect(screen.getByTestId('item').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('keeps the menu open by default, unlike Menu.Item', async () => {
    const user = userEvent.setup();
    await render(<TestCheckboxMenu />);

    await user.press(screen.getByTestId('item'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('closes the menu with closeOnClick', async () => {
    const user = userEvent.setup();
    await render(<TestCheckboxMenu closeOnClick />);

    await user.press(screen.getByTestId('item'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('ignores presses when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    await render(<TestCheckboxMenu disabled onCheckedChange={onCheckedChange} />);

    await user.press(screen.getByTestId('item'));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('item').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('keepMounted keeps the indicator rendered while unticked', async () => {
    await render(
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem testID="item">
                <Menu.CheckboxItemIndicator testID="indicator" keepMounted>
                  <Text>✓</Text>
                </Menu.CheckboxItemIndicator>
              </Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.getByTestId('indicator', hidden)).toBeTruthy();
  });
});

describe('Menu.RadioItem', () => {
  it('throws without a RadioGroup', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      render(
        <Menu.Root defaultOpen>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.RadioItem value="sm" />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      ),
    ).rejects.toThrow(/must be placed within <Menu.RadioGroup>/);

    error.mockRestore();
  });

  it('throws when the indicator is used outside a RadioItem', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Menu.RadioItemIndicator />)).rejects.toThrow(
      /must be placed within <Menu.RadioItem>/,
    );

    error.mockRestore();
  });

  it('selects nothing by default', async () => {
    await render(<TestRadioMenu />);

    expect(screen.getByTestId('item-sm').props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.queryByTestId('indicator-sm', hidden)).toBeNull();
  });

  it('honours defaultValue', async () => {
    await render(<TestRadioMenu defaultValue="md" />);

    expect(screen.getByTestId('item-md').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('indicator-md', hidden)).toBeTruthy();
    expect(screen.getByTestId('item-sm').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('selects on press, deselecting the previous item', async () => {
    const user = userEvent.setup();
    await render(<TestRadioMenu defaultValue="sm" />);

    await user.press(screen.getByTestId('item-lg'));

    expect(screen.getByTestId('item-lg').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('item-sm').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('reports the change with the item-press reason', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<TestRadioMenu onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-md'));

    expect(onValueChange).toHaveBeenCalledWith('md', expect.objectContaining({ reason: 'item-press' }));
  });

  it('holds a controlled value the consumer does not change', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<TestRadioMenu value="sm" onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-lg'));

    expect(onValueChange).toHaveBeenCalledWith('lg', expect.anything());
    expect(screen.getByTestId('item-sm').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('lets onValueChange cancel the change', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn((_value, eventDetails) => eventDetails.cancel());
    await render(<TestRadioMenu defaultValue="sm" onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-lg'));

    expect(screen.getByTestId('item-sm').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('keeps the menu open by default', async () => {
    const user = userEvent.setup();
    await render(<TestRadioMenu />);

    await user.press(screen.getByTestId('item-md'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('a disabled group disables its items', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<TestRadioMenu disabled onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-md'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('item-md').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('groups the items for assistive technology', async () => {
    await render(<TestRadioMenu />);

    expect(screen.getByTestId('group').props.accessibilityRole).toBe('radiogroup');
    expect(screen.getByTestId('item-sm').props.accessibilityRole).toBe('menuitem');
  });
});

describe('Menu.LinkItem', () => {
  function TestLinkMenu(props: React.ComponentProps<typeof Menu.LinkItem>) {
    return (
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup testID="popup">
              <Menu.LinkItem testID="link" {...props}>
                <Text>Docs</Text>
              </Menu.LinkItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }

  it('has a link role', async () => {
    await render(<TestLinkMenu />);

    expect(screen.getByTestId('link').props.accessibilityRole).toBe('link');
  });

  it('calls onPress and leaves the menu open by default', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<TestLinkMenu onPress={onPress} />);

    await user.press(screen.getByTestId('link'));

    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('closes with the link-press reason when closeOnClick is set', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    await render(
      <Menu.Root defaultOpen onOpenChange={onOpenChange}>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup testID="popup">
              <Menu.LinkItem testID="link" closeOnClick>
                <Text>Docs</Text>
              </Menu.LinkItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await user.press(screen.getByTestId('link'));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'link-press' }));
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('ignores presses when disabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<TestLinkMenu disabled onPress={onPress} />);

    await user.press(screen.getByTestId('link'));

    expect(onPress).not.toHaveBeenCalled();
  });
});

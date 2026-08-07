import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Autocomplete, Combobox } from '../../index';

const FRUITS = ['Apple', 'Banana', 'Cherry'];

/**
 * The trigger-based shape: the closed state reads as a button, and the input
 * lives inside the popup and filters from there. This is the usual shape on a
 * phone, where a bare text field gives no affordance that a list will appear.
 */
function TestTrigger(props: Partial<React.ComponentProps<typeof Combobox.Root>>) {
  return (
    <Combobox.Root items={FRUITS} {...props}>
      <Combobox.Trigger testID="trigger">
        <Combobox.Value testID="value" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Backdrop testID="backdrop" />
        <Combobox.Positioner>
          <Combobox.Popup testID="popup">
            <Combobox.Input testID="input" />
            <Combobox.List>
              {(item) => (
                <Combobox.Item key={String(item.value)} testID={`item-${item.value}`} item={item}>
                  <Text>{item.label}</Text>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

const hidden = { includeHiddenElements: true } as const;

describe('Combobox.Trigger', () => {
  it('opens the list on press', async () => {
    await render(<TestTrigger />);
    expect(screen.queryByTestId('popup')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('closes it again on a second press', async () => {
    await render(<TestTrigger defaultOpen />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('reports the trigger-press reason', async () => {
    const onOpenChange = jest.fn();
    await render(<TestTrigger onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
  });

  it('is a combobox for assistive technology, and reports expansion', async () => {
    await render(<TestTrigger />);

    const trigger = screen.getByTestId('trigger');
    expect(trigger.props.role).toBe('combobox');
    expect(trigger.props['aria-haspopup']).toBe('listbox');
    expect(trigger.props.accessibilityState.expanded).toBe(false);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('trigger').props.accessibilityState.expanded).toBe(true);
  });

  it('does not open while disabled', async () => {
    await render(<TestTrigger disabled />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('popup')).toBeNull();
    expect(screen.getByTestId('trigger').props.accessibilityState.disabled).toBe(true);
  });

  it('selects through the popup input and shows the label on the trigger', async () => {
    await render(<TestTrigger defaultOpen />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Banana'));

    expect(screen.queryByTestId('popup')).toBeNull();
    expect(screen.getByTestId('value', hidden)).toHaveTextContent('Banana');
  });

  it('opens through a handle from a detached trigger', async () => {
    const handle = Combobox.createHandle();

    await render(
      <>
        <Combobox.Trigger testID="trigger" nativeID="fruit-trigger" handle={handle}>
          <Text>Pick</Text>
        </Combobox.Trigger>
        <Combobox.Root items={FRUITS} handle={handle}>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup testID="popup" />
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </>,
    );

    expect(screen.queryByTestId('popup')).toBeNull();

    await act(async () => {
      handle.open('fruit-trigger');
    });
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('throws with neither a root nor a handle', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        render(
          <Combobox.Trigger>
            <Text>Pick</Text>
          </Combobox.Trigger>,
        ),
      ).rejects.toThrow(/must be placed within <Combobox.Root>/);
    } finally {
      warn.mockRestore();
    }
  });

  it('works the same on an Autocomplete', async () => {
    await render(
      <Autocomplete.Root items={FRUITS}>
        <Autocomplete.Trigger testID="trigger">
          <Text>Search</Text>
        </Autocomplete.Trigger>
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup testID="popup">
              <Autocomplete.Input testID="input" />
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(screen.getByTestId('input')).toBeTruthy();
  });
});

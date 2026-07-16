import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Combobox, Autocomplete } from '../../index';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Cherry'];

function TestCombobox(props: React.ComponentProps<typeof Combobox.Root>) {
  return (
    <Combobox.Root items={FRUITS} {...props}>
      <Combobox.Input testID="input" />
      <Combobox.Portal>
        <Combobox.Backdrop testID="backdrop" />
        <Combobox.Positioner testID="positioner">
          <Combobox.Popup testID="popup">
            <Combobox.Empty testID="empty">
              <Text>No fruit</Text>
            </Combobox.Empty>
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

async function focus(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), 'focus');
  });
}

async function type(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), text);
  });
}

const hidden = { includeHiddenElements: true } as const;

describe('Combobox', () => {
  it('opens the list when the input is focused', async () => {
    await render(<TestCombobox />);
    expect(screen.queryByTestId('popup')).toBeNull();

    await focus('input');
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('filters the items by the typed query', async () => {
    await render(<TestCombobox defaultOpen />);

    await type('input', 'ap');

    expect(screen.getByTestId('item-Apple')).toBeTruthy();
    expect(screen.getByTestId('item-Apricot')).toBeTruthy();
    expect(screen.queryByTestId('item-Banana')).toBeNull();
  });

  it('shows the empty state when nothing matches', async () => {
    await render(<TestCombobox defaultOpen />);

    await type('input', 'zzz');

    expect(screen.getByTestId('empty', hidden)).toBeTruthy();
    expect(screen.queryByTestId('item-Apple')).toBeNull();
  });

  it('selects an item, fills the input, and closes', async () => {
    const onValueChange = jest.fn();
    await render(<TestCombobox defaultOpen onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Banana'));

    expect(onValueChange).toHaveBeenCalledWith('Banana');
    expect(screen.getByTestId('input').props.value).toBe('Banana');
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('does not warn about a changing default when a controlled value updates', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      function Controlled() {
        const [value, setValue] = React.useState<unknown>(null);
        return <TestCombobox defaultOpen value={value} onValueChange={setValue} />;
      }
      await render(<Controlled />);

      const user = userEvent.setup();
      await user.press(screen.getByTestId('item-Banana'));

      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('changing the default'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('reflects a controlled value change into the input text', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<unknown>('Apple');
      return (
        <>
          <Combobox.Root items={FRUITS} value={value}>
            <Combobox.Input testID="input" />
          </Combobox.Root>
          <Text testID="set" onPress={() => setValue('Cherry')}>
            set
          </Text>
        </>
      );
    }
    await render(<Controlled />);

    expect(screen.getByTestId('input').props.value).toBe('Apple');

    const user = userEvent.setup();
    await user.press(screen.getByTestId('set'));

    expect(screen.getByTestId('input').props.value).toBe('Cherry');
  });

  it('shows every item on focus, not just the selected one', async () => {
    await render(<TestCombobox defaultValue="Banana" />);

    // The input starts showing the selection...
    expect(screen.getByTestId('input').props.value).toBe('Banana');

    // ...but focusing reveals the whole list, not just "Banana".
    await focus('input');
    expect(screen.getByTestId('item-Apple')).toBeTruthy();
    expect(screen.getByTestId('item-Cherry')).toBeTruthy();
  });

  it('does not open on focus when openOnFocus is false', async () => {
    await render(<TestCombobox openOnFocus={false} />);
    await focus('input');
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('closes on an outside press', async () => {
    await render(<TestCombobox defaultOpen />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop', hidden));

    expect(screen.queryByTestId('popup')).toBeNull();
  });
});

describe('Autocomplete', () => {
  it('is free text: choosing a suggestion fills the input without a separate value', async () => {
    const onInputValueChange = jest.fn();
    await render(
      <Autocomplete.Root items={FRUITS} defaultOpen onInputValueChange={onInputValueChange}>
        <Autocomplete.Input testID="input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup testID="popup">
              <Autocomplete.List>
                {(item) => (
                  <Autocomplete.Item key={String(item.value)} testID={`item-${item.value}`} item={item}>
                    <Text>{item.label}</Text>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Cherry'));

    expect(onInputValueChange).toHaveBeenCalledWith('Cherry');
    expect(screen.getByTestId('input').props.value).toBe('Cherry');
  });
});

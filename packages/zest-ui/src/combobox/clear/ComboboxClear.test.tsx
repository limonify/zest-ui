import * as React from 'react';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Autocomplete, Combobox } from '../../index';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Cherry'];

function TestClear(props: React.ComponentProps<typeof Combobox.Root>) {
  return (
    <Combobox.Root items={FRUITS} {...props}>
      <Combobox.Input testID="input" />
      <Combobox.Clear testID="clear" accessibilityLabel="Clear" />
    </Combobox.Root>
  );
}

describe('Combobox.Clear', () => {
  it('stays unmounted while there is nothing to clear', async () => {
    await render(<TestClear />);

    expect(screen.queryByTestId('clear')).toBeNull();
  });

  it('appears once a single selection exists, and clears it', async () => {
    const onValueChange = jest.fn();
    const onInputValueChange = jest.fn();
    await render(
      <TestClear
        defaultValue="Banana"
        onValueChange={onValueChange}
        onInputValueChange={onInputValueChange}
      />,
    );

    expect(screen.getByTestId('input').props.value).toBe('Banana');

    const user = userEvent.setup();
    await user.press(screen.getByTestId('clear'));

    expect(onValueChange).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ reason: 'clear-press' }),
    );
    expect(onInputValueChange).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ reason: 'clear-press' }),
    );
    expect(screen.getByTestId('input').props.value).toBe('');
    expect(screen.queryByTestId('clear')).toBeNull();
  });

  it('empties the whole selection of a multiple combobox', async () => {
    const onValueChange = jest.fn();
    await render(
      <TestClear multiple defaultValue={['Apple', 'Cherry']} onValueChange={onValueChange} />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('clear'));

    expect(onValueChange).toHaveBeenCalledWith([], expect.objectContaining({ reason: 'clear-press' }));
    expect(screen.queryByTestId('clear')).toBeNull();
  });

  it('follows the input text in an autocomplete, which has no selection', async () => {
    await render(
      <Autocomplete.Root items={FRUITS}>
        <Autocomplete.Input testID="input" />
        <Autocomplete.Clear testID="clear" accessibilityLabel="Clear" />
      </Autocomplete.Root>,
    );

    expect(screen.queryByTestId('clear')).toBeNull();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'ban');
    });
    expect(screen.getByTestId('clear')).toBeTruthy();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('clear'));

    expect(screen.getByTestId('input').props.value).toBe('');
    expect(screen.queryByTestId('clear')).toBeNull();
  });

  it('lets onValueChange cancel the clear, leaving the input alone', async () => {
    await render(
      <TestClear
        defaultValue="Banana"
        onValueChange={(_value, details) => {
          details.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('clear'));

    expect(screen.getByTestId('input').props.value).toBe('Banana');
  });

  it('stays mounted while invisible when keepMounted is set', async () => {
    const states: boolean[] = [];

    await render(
      <Combobox.Root items={FRUITS}>
        <Combobox.Input testID="input" />
        <Combobox.Clear
          testID="clear"
          keepMounted
          style={(state) => {
            states.push(state.visible);
            return undefined;
          }}
        />
      </Combobox.Root>,
    );

    expect(screen.getByTestId('clear')).toBeTruthy();
    expect(states).toContain(false);
  });

  it('is disabled along with the combobox', async () => {
    await render(<TestClear disabled defaultValue="Banana" />);

    expect(screen.getByTestId('clear').props.accessibilityState.disabled).toBe(true);
  });
});

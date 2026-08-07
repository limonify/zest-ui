import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Combobox } from '../../index';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Cherry'];

function TestChips(props: React.ComponentProps<typeof Combobox.Root>) {
  return (
    <Combobox.Root items={FRUITS} multiple {...props}>
      <Combobox.Chips testID="chips">
        <Combobox.Value>
          {(items) =>
            items.map((item, index) => (
              <Combobox.Chip key={String(item.value)} testID={`chip-${item.value}`}>
                <Text testID={`chip-label-${index}`}>{item.label}</Text>
                <Combobox.ChipRemove
                  testID={`remove-${item.value}`}
                  accessibilityLabel={`Remove ${item.label}`}
                />
              </Combobox.Chip>
            ))
          }
        </Combobox.Value>
        <Combobox.Input testID="input" />
      </Combobox.Chips>
    </Combobox.Root>
  );
}

describe('Combobox.Chips', () => {
  it('renders one chip per selected value, in selection order', async () => {
    await render(<TestChips defaultValue={['Banana', 'Apple']} />);

    expect(screen.getByTestId('chip-Banana')).toBeTruthy();
    expect(screen.getByTestId('chip-Apple')).toBeTruthy();
    expect(screen.queryByTestId('chip-Cherry')).toBeNull();
    expect(screen.getByTestId('chip-label-0').props.children).toBe('Banana');
    expect(screen.getByTestId('chip-label-1').props.children).toBe('Apple');
  });

  it('renders no chips when nothing is selected', async () => {
    await render(<TestChips />);

    expect(screen.queryByTestId('chip-Apple')).toBeNull();
    // The container is only a toolbar once it holds something.
    expect(screen.getByTestId('chips').props.role).toBeUndefined();
  });

  it('marks the container as a toolbar once it holds chips', async () => {
    await render(<TestChips defaultValue={['Apple']} />);

    expect(screen.getByTestId('chips').props.role).toBe('toolbar');
  });

  it('labels a value with no matching item by stringifying it', async () => {
    await render(<TestChips items={undefined} defaultValue={[42]} />);

    expect(screen.getByTestId('chip-label-0').props.children).toBe('42');
  });

  it('removes the chip its button belongs to, reporting chip-remove-press', async () => {
    const onValueChange = jest.fn();
    await render(
      <TestChips defaultValue={['Apple', 'Banana', 'Cherry']} onValueChange={onValueChange} />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('remove-Banana'));

    expect(onValueChange).toHaveBeenCalledWith(
      ['Apple', 'Cherry'],
      expect.objectContaining({ reason: 'chip-remove-press' }),
    );
    expect(screen.queryByTestId('chip-Banana')).toBeNull();
  });

  it('lets onValueChange cancel a removal', async () => {
    await render(
      <TestChips
        defaultValue={['Apple', 'Banana']}
        onValueChange={(_value, details) => {
          details.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('remove-Banana'));

    expect(screen.getByTestId('chip-Banana')).toBeTruthy();
  });

  it('exposes the chip index and item on state', async () => {
    const states: Array<{ index: number; label: string | undefined }> = [];

    await render(
      <Combobox.Root items={FRUITS} multiple defaultValue={['Apple', 'Cherry']}>
        <Combobox.Chips>
          <Combobox.Value>
            {(items) =>
              items.map((item) => (
                <Combobox.Chip
                  key={String(item.value)}
                  style={(state) => {
                    states.push({ index: state.index, label: state.item?.label });
                    return undefined;
                  }}
                />
              ))
            }
          </Combobox.Value>
        </Combobox.Chips>
      </Combobox.Root>,
    );

    // Chips are indexed in registration order until they report a layout.
    expect(states).toContainEqual({ index: 0, label: 'Apple' });
    expect(states).toContainEqual({ index: 1, label: 'Cherry' });
  });

  it('disables the remove button along with the combobox', async () => {
    await render(<TestChips disabled defaultValue={['Apple']} />);

    const button = screen.getByTestId('remove-Apple');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('throws when a chip part is used outside a chip', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        render(
          <Combobox.Root items={FRUITS} multiple>
            <Combobox.ChipRemove />
          </Combobox.Root>,
        ),
      ).rejects.toThrow(/ComboboxChipContext is missing/);
    } finally {
      warn.mockRestore();
    }
  });
});

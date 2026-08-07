import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Combobox, Select } from '../index';

/**
 * Choosing one row must not re-render the other forty-nine. Two things had to be
 * true for that:
 *
 * 1. An item subscribes to the *boolean* `isSelected(itemValue)` rather than to
 *    the whole selection, so `useSyncExternalStore` bails out for every row
 *    whose answer did not change.
 * 2. The selected items live in their own context, apart from the filtered ones.
 *    Sharing one meant a new context value on every selection, which re-rendered
 *    `Combobox.List` and with it every row — defeating (1) entirely.
 *
 * These count renders, so a regression in either shows up as a number.
 */
const COUNT = 50;
const ITEMS = Array.from({ length: COUNT }, (_, i) => `Item ${i}`);

function counter() {
  const renders = jest.fn();
  return { renders, style: () => { renders(); return undefined; } };
}

describe('list render cost', () => {
  it('Combobox re-renders one row per selection, not the whole list', async () => {
    const { renders, style } = counter();

    await render(
      <Combobox.Root items={ITEMS} multiple defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item
                    key={String(item.value)}
                    testID={`item-${item.value}`}
                    item={item}
                    style={style}
                  >
                    <Text>{item.label}</Text>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    renders.mockClear();
    await act(async () => {
      fireEvent.press(screen.getByTestId('item-Item 3'));
    });

    expect(renders.mock.calls.length).toBe(1);

    // And deselecting is the same, from the other direction.
    renders.mockClear();
    await act(async () => {
      fireEvent.press(screen.getByTestId('item-Item 3'));
    });
    expect(renders.mock.calls.length).toBe(1);
  });

  it('Select got the same treatment', async () => {
    const { renders, style } = counter();

    await render(
      <Select.Root defaultOpen multiple defaultValue={['Item 1']}>
        <Select.Trigger testID="trigger" />
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {ITEMS.map((item) => (
                  <Select.Item key={item} testID={`item-${item}`} value={item} style={style} />
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    renders.mockClear();
    await act(async () => {
      fireEvent.press(screen.getByTestId('item-Item 2'));
    });

    // Only the row that changed. A single-selection Select closes on press and
    // unmounts its rows, so `multiple` is where this is observable at all.
    expect(renders.mock.calls.length).toBe(1);
  });

  it('still re-renders the list when the query changes it', async () => {
    const { renders, style } = counter();

    await render(
      <Combobox.Root items={['Apple', 'Apricot', 'Banana']} defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item key={String(item.value)} item={item} style={style}>
                    <Text>{item.label}</Text>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    renders.mockClear();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'ap');
    });

    // Filtering is a real change to the list, so the surviving rows do render.
    expect(renders.mock.calls.length).toBeGreaterThan(0);
    expect(screen.queryByText('Banana')).toBeNull();
  });
});

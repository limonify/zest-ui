import * as React from 'react';
import { FlatList, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Combobox } from '../../index';
import type { ComboboxItem } from '../store/ComboboxStore';

/**
 * zest has no `virtualized` prop — upstream's is DOM-bound, and React Native
 * already ships the right answer in `FlatList`. What zest owes the consumer is
 * the filtered data, which `Combobox.List` publishes on `state.items` so a
 * `render` function can hand it over.
 *
 * These prove the recipe in the docs actually works rather than merely reading
 * well: the list virtualizes, filtering still drives it, and selection still
 * flows through the rows.
 */
const ITEMS = Array.from({ length: 200 }, (_, i) => `Item ${i}`);

function VirtualizedCombobox(props: { onValueChange?: (value: unknown) => void }) {
  return (
    <Combobox.Root items={ITEMS} defaultOpen onValueChange={props.onValueChange}>
      <Combobox.Input testID="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List
              testID="list"
              render={(elementProps, state) => (
                <FlatList
                  {...elementProps}
                  // The rows come from `data`, not from children.
                  children={undefined}
                  data={state.items as ComboboxItem[]}
                  keyExtractor={(item) => String(item.value)}
                  initialNumToRender={10}
                  renderItem={({ item }) => (
                    <Combobox.Item testID={`item-${item.value}`} item={item}>
                      <Text>{item.label}</Text>
                    </Combobox.Item>
                  )}
                />
              )}
            />
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

describe('a virtualized Combobox.List', () => {
  it('renders through FlatList without mounting all 200 rows', async () => {
    await render(<VirtualizedCombobox />);

    expect(screen.getByTestId('item-Item 0')).toBeTruthy();

    // `initialNumToRender` is respected, so the tail is not mounted.
    expect(screen.queryByTestId('item-Item 199')).toBeNull();
  });

  it('follows the query', async () => {
    await render(<VirtualizedCombobox />);

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'Item 19');
    });

    // 'Item 19' plus 'Item 190'…'Item 199' — the first of them is mounted, and
    // everything that did not match is gone.
    expect(screen.getByTestId('item-Item 19')).toBeTruthy();
    expect(screen.queryByTestId('item-Item 0')).toBeNull();
  });

  it('still selects through the rows it renders', async () => {
    const onValueChange = jest.fn();
    await render(<VirtualizedCombobox onValueChange={onValueChange} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('item-Item 2'));
    });

    expect(onValueChange).toHaveBeenCalledWith('Item 2', expect.anything());
  });

  it('publishes the same entries children would receive', async () => {
    const seen: unknown[] = [];

    await render(
      <Combobox.Root items={['Apple', 'Apricot', 'Banana']} defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List
                render={(elementProps, state) => {
                  seen.push(state.items.map((i) => i.label));
                  return <Text {...elementProps} testID="list" />;
                }}
              />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(seen.at(-1)).toEqual(['Apple', 'Apricot', 'Banana']);

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'ap');
    });

    expect(seen.at(-1)).toEqual(['Apple', 'Apricot']);
  });
});

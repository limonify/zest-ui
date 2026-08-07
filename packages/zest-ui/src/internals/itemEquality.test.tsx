import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Combobox, Select } from '../index';
import {
  compareItemEquality,
  defaultItemEquality,
  findItemIndex,
  removeItem,
  selectedValueIncludes,
} from './itemEquality';

type Fruit = { id: number; label: string };

const FRUITS: Fruit[] = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' },
  { id: 3, label: 'Cherry' },
];

const byId = (a: Fruit, b: Fruit) => a.id === b.id;

describe('itemEquality', () => {
  it('defaults to Object.is', () => {
    expect(defaultItemEquality(FRUITS[0], FRUITS[0])).toBe(true);
    expect(defaultItemEquality(FRUITS[0], { ...FRUITS[0] })).toBe(false);
    expect(defaultItemEquality(NaN, NaN)).toBe(true);
  });

  it('never hands null or undefined to the comparer', () => {
    const comparer = jest.fn(byId);

    expect(compareItemEquality(null, FRUITS[0], comparer as never)).toBe(false);
    expect(compareItemEquality(undefined, undefined, comparer as never)).toBe(true);
    expect(comparer).not.toHaveBeenCalled();
  });

  it('finds, includes and removes by the comparer', () => {
    const copy = { id: 2, label: 'Banana' };

    expect(selectedValueIncludes(FRUITS, copy, byId)).toBe(true);
    expect(selectedValueIncludes(FRUITS, copy, defaultItemEquality)).toBe(false);
    expect(findItemIndex(FRUITS, copy, byId)).toBe(1);
    expect(removeItem(FRUITS, copy, byId)).toEqual([FRUITS[0], FRUITS[2]]);
  });

  it('treats an empty selection as containing nothing', () => {
    expect(selectedValueIncludes([], FRUITS[0], byId)).toBe(false);
    expect(selectedValueIncludes(undefined, FRUITS[0], byId)).toBe(false);
    expect(findItemIndex(undefined, FRUITS[0], byId)).toBe(-1);
  });
});

describe('Select isItemEqualToValue', () => {
  function TestSelect(props: Partial<React.ComponentProps<typeof Select.Root>>) {
    return (
      <Select.Root items={FRUITS.map((f) => ({ value: f, label: f.label }))} defaultOpen {...props}>
        <Select.Trigger testID="trigger">
          <Select.Value testID="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {FRUITS.map((fruit) => (
                  // A fresh object every render — exactly what a comparer is for.
                  <Select.Item key={fruit.id} testID={`item-${fruit.id}`} value={{ ...fruit }}>
                    <Select.ItemText>{fruit.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
  }

  it('does not match an equal-but-distinct object by default', async () => {
    await render(<TestSelect defaultValue={{ id: 2, label: 'Banana' }} />);

    expect(screen.getByTestId('item-2').props.accessibilityState.selected).toBe(false);
  });

  it('matches by the comparer when one is given', async () => {
    await render(<TestSelect defaultValue={{ id: 2, label: 'Banana' }} isItemEqualToValue={byId} />);

    expect(screen.getByTestId('item-2').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('item-1').props.accessibilityState.selected).toBe(false);
  });

  it('resolves the label of an object value through the comparer', async () => {
    await render(<TestSelect defaultValue={{ id: 3, label: 'Cherry' }} isItemEqualToValue={byId} />);

    expect(screen.getByTestId('value')).toHaveTextContent('Cherry');
  });

  it('toggles the right object out of a multiple selection', async () => {
    const onValueChange = jest.fn();
    await render(
      <TestSelect
        multiple
        isItemEqualToValue={byId}
        defaultValue={[{ id: 1, label: 'Apple' }, { id: 2, label: 'Banana' }]}
        onValueChange={onValueChange}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-1'));

    expect(onValueChange).toHaveBeenCalledWith(
      [{ id: 2, label: 'Banana' }],
      expect.anything(),
    );
  });
});

describe('Combobox isItemEqualToValue', () => {
  function TestCombobox(props: Partial<React.ComponentProps<typeof Combobox.Root>>) {
    return (
      <Combobox.Root
        items={FRUITS.map((f) => ({ value: { ...f }, label: f.label }))}
        defaultOpen
        {...props}
      >
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item
                    key={(item.value as Fruit).id}
                    testID={`item-${(item.value as Fruit).id}`}
                    item={item}
                  >
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

  it('does not match an equal-but-distinct object by default', async () => {
    await render(<TestCombobox defaultValue={{ id: 2, label: 'Banana' }} />);

    expect(screen.getByTestId('item-2').props.accessibilityState.selected).toBe(false);
  });

  it('matches by the comparer when one is given', async () => {
    await render(
      <TestCombobox defaultValue={{ id: 2, label: 'Banana' }} isItemEqualToValue={byId} />,
    );

    expect(screen.getByTestId('item-2').props.accessibilityState.selected).toBe(true);
  });

  it('fills the input from an object value through the comparer', async () => {
    await render(
      <TestCombobox defaultValue={{ id: 3, label: 'Cherry' }} isItemEqualToValue={byId} />,
    );

    expect(screen.getByTestId('input').props.value).toBe('Cherry');
  });

  it('toggles the right object out of a multiple selection', async () => {
    const onValueChange = jest.fn();
    await render(
      <TestCombobox
        multiple
        isItemEqualToValue={byId}
        defaultValue={[{ id: 1, label: 'Apple' }, { id: 3, label: 'Cherry' }]}
        onValueChange={onValueChange}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-3'));

    expect(onValueChange).toHaveBeenLastCalledWith(
      [{ id: 1, label: 'Apple' }],
      expect.anything(),
    );
  });

  it('resolves chips from object values through the comparer', async () => {
    await render(
      <Combobox.Root
        items={FRUITS.map((f) => ({ value: { ...f }, label: f.label }))}
        multiple
        isItemEqualToValue={byId}
        defaultValue={[{ id: 2, label: 'Banana' }]}
      >
        <Combobox.Chips>
          <Combobox.Value>
            {(items) => items.map((item) => <Text key={item.label} testID="chip">{item.label}</Text>)}
          </Combobox.Value>
        </Combobox.Chips>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('chip')).toHaveTextContent('Banana');
  });
});

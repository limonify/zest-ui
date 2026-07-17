import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Select } from '../index';

const FRUITS = ['apple', 'banana', 'cherry'];

function TestSelect(props: React.ComponentProps<typeof Select.Root> & { disabledItems?: string[] }) {
  const { disabledItems = [], ...rootProps } = props;

  return (
    <Select.Root {...rootProps}>
      <Select.Trigger testID="trigger">
        <Select.Value testID="value" />
        <Select.Icon testID="icon" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Backdrop testID="backdrop" />
        <Select.Positioner testID="positioner">
          <Select.Popup testID="popup">
            <Select.List testID="list">
              <Select.Group testID="group">
                <Select.GroupLabel testID="group-label">Fruit</Select.GroupLabel>
                {FRUITS.map((fruit) => (
                  <Select.Item
                    key={fruit}
                    testID={`item-${fruit}`}
                    value={fruit}
                    disabled={disabledItems.includes(fruit)}
                  >
                    <Select.ItemText testID={`text-${fruit}`}>{fruit}</Select.ItemText>
                    <Select.ItemIndicator testID={`indicator-${fruit}`} />
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

describe('Select', () => {
  it('selects an item and closes the popup', async () => {
    const onValueChange = jest.fn();
    const onOpenChange = jest.fn();
    await render(<TestSelect onValueChange={onValueChange} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();

    await user.press(screen.getByTestId('item-banana'));

    expect(onValueChange).toHaveBeenCalledWith(
      'banana',
      expect.objectContaining({ reason: 'item-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('renders the selected label from the items prop while the popup has never opened', async () => {
    await render(<TestSelect defaultValue="cherry" items={{ cherry: 'Cherry' }} />);

    // The items live in the portal, so nothing has registered a label yet.
    expect(screen.getByTestId('value')).toHaveTextContent('Cherry');
  });

  it('falls back to the label registered by ItemText once the items have mounted', async () => {
    await render(<TestSelect defaultOpen defaultValue="cherry" />);

    expect(screen.getByTestId('value')).toHaveTextContent('cherry');
  });

  it('supports non-string values in the items prop', async () => {
    await render(
      <Select.Root defaultValue={2} items={[{ value: 2, label: 'Two' }]}>
        <Select.Trigger testID="trigger">
          <Select.Value testID="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value={2}>
                <Select.ItemText>Two</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.getByTestId('value')).toHaveTextContent('Two');
  });

  it('marks the selected item and renders only its indicator', async () => {
    await render(<TestSelect defaultOpen defaultValue="apple" />);

    expect(screen.getByTestId('item-apple').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId('item-banana').props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(screen.getByTestId('indicator-apple')).toBeTruthy();
    expect(screen.queryByTestId('indicator-banana')).toBeNull();
  });

  it('respects the controlled value prop', async () => {
    const onValueChange = jest.fn();
    await render(
      <TestSelect defaultOpen value="apple" items={{ apple: 'Apple', banana: 'Banana' }} onValueChange={onValueChange} />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-banana'));

    expect(onValueChange).toHaveBeenCalledWith('banana', expect.anything());
    // Pressing an item closes the popup, so assert the selection through the
    // trigger: controlled, it only moves when the owner flips the prop.
    expect(screen.getByTestId('value')).toHaveTextContent('Apple');
  });

  it('cancelling the value change also keeps the popup open', async () => {
    await render(
      <TestSelect
        defaultOpen
        onValueChange={(value, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-banana'));

    // The item shares one event details object between the value change and the
    // close, so a veto stops both.
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('ignores presses on a disabled item', async () => {
    const onValueChange = jest.fn();
    await render(<TestSelect defaultOpen disabledItems={['banana']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-banana'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('ignores interaction when readOnly', async () => {
    const onOpenChange = jest.fn();
    await render(<TestSelect readOnly onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('trigger').props['aria-readonly']).toBe(true);
  });

  it('propagates disabled from the root to the trigger', async () => {
    const onOpenChange = jest.fn();
    await render(<TestSelect disabled onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on an outside press via the Backdrop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestSelect defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
  });

  it('wires select accessibility semantics', async () => {
    await render(<TestSelect defaultOpen />);

    const trigger = screen.getByTestId('trigger');
    expect(trigger.props.accessibilityRole).toBe('combobox');
    expect(trigger.props['aria-haspopup']).toBe('listbox');
    expect(screen.getByTestId('list').props.role).toBe('listbox');
    expect(screen.getByTestId('item-apple').props.role).toBe('option');
    // The icon is decorative, so it is hidden from the accessibility tree and
    // the default query cannot see it.
    expect(
      screen.getByTestId('icon', { includeHiddenElements: true }).props.accessibilityElementsHidden,
    ).toBe(true);

    const group = screen.getByTestId('group');
    const groupLabel = screen.getByTestId('group-label');
    expect(group.props.accessibilityLabelledBy).toBe(groupLabel.props.nativeID);
  });

  it('indexes its items in visual order', async () => {
    const styleFn = jest.fn(() => ({}));
    await render(
      <Select.Root defaultOpen>
        <Select.Trigger testID="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup testID="popup">
              <Select.Item value="a">
                <Select.ItemText>A</Select.ItemText>
              </Select.Item>
              <Select.Item value="b" style={styleFn}>
                <Select.ItemText>B</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
  });

  it('supports formatting the value through a children function', async () => {
    await render(
      <Select.Root defaultValue="apple">
        <Select.Trigger testID="trigger">
          <Select.Value testID="value">
            {(state) => <Text>{state.label ? state.label.toUpperCase() : 'None'}</Text>}
          </Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="apple">
                <Select.ItemText>apple</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    // No `items` prop and the popup has never opened, so no label is known yet.
    expect(screen.getByTestId('value')).toHaveTextContent('None');
  });
});

describe('Select multiple', () => {
  const ITEMS = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];

  function TestMultiSelect(props: Partial<React.ComponentProps<typeof Select.Root>>) {
    return (
      <Select.Root multiple items={ITEMS} defaultOpen {...props}>
        <Select.Trigger testID="trigger">
          <Select.Value testID="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup testID="popup">
              <Select.List>
                {ITEMS.map((item) => (
                  <Select.Item key={item.value} testID={`item-${item.value}`} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator testID={`indicator-${item.value}`}>
                      <Text>✓</Text>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
  }

  function selected(value: string) {
    return screen.getByTestId(`item-${value}`).props.accessibilityState.selected;
  }

  it('starts with nothing selected', async () => {
    const onValueChange = jest.fn();
    await render(<TestMultiSelect onValueChange={onValueChange} />);

    expect(selected('apple')).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reports an array and keeps the popup open', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<TestMultiSelect onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-apple'));

    expect(onValueChange).toHaveBeenCalledWith(['apple'], expect.objectContaining({ reason: 'item-press' }));
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('adds to the selection rather than replacing it', async () => {
    const user = userEvent.setup();
    await render(<TestMultiSelect />);

    await user.press(screen.getByTestId('item-apple'));
    await user.press(screen.getByTestId('item-cherry'));

    expect(selected('apple')).toBe(true);
    expect(selected('cherry')).toBe(true);
    expect(selected('banana')).toBe(false);
  });

  it('toggles an already selected item off', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<TestMultiSelect defaultValue={['apple', 'banana']} onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-apple'));

    expect(onValueChange).toHaveBeenCalledWith(['banana'], expect.anything());
    expect(selected('apple')).toBe(false);
    expect(selected('banana')).toBe(true);
  });

  it('honours a defaultValue array', async () => {
    await render(<TestMultiSelect defaultValue={['banana']} />);

    expect(selected('banana')).toBe(true);
    expect(screen.getByTestId('indicator-banana', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('indicator-apple', { includeHiddenElements: true })).toBeNull();
  });

  it('holds a controlled value the consumer does not change', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<TestMultiSelect value={['apple']} onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-banana'));

    expect(onValueChange).toHaveBeenCalledWith(['apple', 'banana'], expect.anything());
    expect(selected('banana')).toBe(false);
  });

  it('lets onValueChange cancel the change', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn((_value, eventDetails) => eventDetails.cancel());
    await render(<TestMultiSelect onValueChange={onValueChange} />);

    await user.press(screen.getByTestId('item-apple'));

    expect(selected('apple')).toBe(false);
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('joins the selected labels and exposes them individually', async () => {
    await render(<TestMultiSelect defaultValue={['apple', 'cherry']} />);

    expect(screen.getByTestId('value')).toHaveTextContent('Apple, Cherry');
  });

  it('gives a children function every label', async () => {
    const seen: string[][] = [];
    await render(
      <Select.Root multiple items={ITEMS} defaultValue={['apple', 'banana']}>
        <Select.Trigger>
          <Select.Value testID="value">
            {(state) => {
              seen.push(state.labels);
              return state.labels.join(' + ');
            }}
          </Select.Value>
        </Select.Trigger>
      </Select.Root>,
    );

    expect(seen.at(-1)).toEqual(['Apple', 'Banana']);
    expect(screen.getByTestId('value')).toHaveTextContent('Apple + Banana');
  });

  it('still closes on a single select, unlike multiple', async () => {
    const user = userEvent.setup();
    await render(<TestMultiSelect multiple={false} defaultValue="apple" />);

    await user.press(screen.getByTestId('item-banana'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });
});

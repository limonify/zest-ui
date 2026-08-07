import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Combobox } from '../../index';
import { isComboboxGroup } from '../store/ComboboxStore';

const GROUPED = [
  { label: 'Fruit', items: ['Apple', 'Apricot', 'Banana'] },
  { label: 'Vegetable', items: ['Carrot', 'Celery'] },
];

function TestGrouped(props: Partial<React.ComponentProps<typeof Combobox.Root>>) {
  return (
    <Combobox.Root items={GROUPED} defaultOpen {...props}>
      <Combobox.Input testID="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Empty testID="empty">
              <Text>No match</Text>
            </Combobox.Empty>
            <Combobox.List testID="list">
              {(entry) =>
                isComboboxGroup(entry) ? (
                  <Combobox.Group
                    key={String(entry.value)}
                    testID={`group-${entry.label}`}
                    items={entry.items}
                  >
                    <Combobox.GroupLabel testID={`label-${entry.label}`}>
                      {entry.label}
                    </Combobox.GroupLabel>
                    <Combobox.Collection>
                      {(item) => (
                        <Combobox.Item
                          key={String(item.value)}
                          testID={`item-${item.value}`}
                          item={item}
                        >
                          <Text>{item.label}</Text>
                          <Combobox.ItemIndicator testID={`indicator-${item.value}`} />
                        </Combobox.Item>
                      )}
                    </Combobox.Collection>
                  </Combobox.Group>
                ) : null
              }
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

async function type(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('input'), text);
  });
}

const hidden = { includeHiddenElements: true } as const;

describe('Combobox.Group', () => {
  it('renders every group and its items', async () => {
    await render(<TestGrouped />);

    expect(screen.getByTestId('group-Fruit')).toBeTruthy();
    expect(screen.getByTestId('group-Vegetable')).toBeTruthy();
    expect(screen.getByTestId('item-Apple')).toBeTruthy();
    expect(screen.getByTestId('item-Celery')).toBeTruthy();
  });

  it('associates the label with its group', async () => {
    await render(<TestGrouped />);

    const group = screen.getByTestId('group-Fruit');
    const label = screen.getByTestId('label-Fruit');

    expect(group.props.accessibilityLabelledBy).toBe(label.props.nativeID);
    expect(group.props.role).toBe('group');
    expect(label.props.role).toBe('heading');
  });

  it('filters inside a group and drops the groups left empty', async () => {
    await render(<TestGrouped />);

    await type('car');

    expect(screen.getByTestId('item-Carrot')).toBeTruthy();
    expect(screen.getByTestId('group-Vegetable')).toBeTruthy();
    // Nothing under Fruit matched, so the whole group is gone.
    expect(screen.queryByTestId('group-Fruit')).toBeNull();
    expect(screen.queryByTestId('item-Apple')).toBeNull();
  });

  it('never matches a group on its own label', async () => {
    await render(<TestGrouped />);

    // "Fruit" is a group name, not an item — matching it would resurrect the
    // entire group.
    await type('fruit');

    expect(screen.queryByTestId('group-Fruit')).toBeNull();
    expect(screen.getByTestId('empty', hidden)).toBeTruthy();
  });

  it('is empty when a group survives with no items', async () => {
    await render(<TestGrouped />);

    await type('zzz');

    expect(screen.getByTestId('empty', hidden)).toBeTruthy();
    expect(screen.getByTestId('list').props.children).toEqual([]);
  });

  it('selects an item from inside a group', async () => {
    const onValueChange = jest.fn();
    await render(<TestGrouped onValueChange={onValueChange} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('item-Celery'));
    });

    expect(onValueChange).toHaveBeenCalledWith('Celery', expect.anything());
  });

  it('takes an explicit group value when one is given', async () => {
    await render(
      <TestGrouped items={[{ value: 'g1', label: 'Fruit', items: ['Apple'] }]} />,
    );

    expect(screen.getByTestId('group-Fruit')).toBeTruthy();
  });

  it('renders every filtered item when Collection is used outside a group', async () => {
    await render(
      <Combobox.Root items={GROUPED} defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>{() => null}</Combobox.List>
              <Combobox.Collection>
                {(item) => (
                  <Combobox.Item key={String(item.value)} testID={`flat-${item.value}`} item={item}>
                    <Text>{item.label}</Text>
                  </Combobox.Item>
                )}
              </Combobox.Collection>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    // Groups flattened away: all five items, no group wrappers.
    expect(screen.getByTestId('flat-Apple')).toBeTruthy();
    expect(screen.getByTestId('flat-Celery')).toBeTruthy();
  });
});

describe('Combobox.ItemIndicator', () => {
  it('renders only for the selected item', async () => {
    await render(<TestGrouped defaultValue="Banana" />);

    expect(screen.getByTestId('indicator-Banana')).toBeTruthy();
    expect(screen.queryByTestId('indicator-Apple')).toBeNull();
  });

  it('stays mounted for every item when keepMounted is set', async () => {
    await render(
      <Combobox.Root items={['Apple', 'Banana']} defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item key={String(item.value)} item={item}>
                    <Combobox.ItemIndicator testID={`indicator-${item.value}`} keepMounted />
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('indicator-Apple')).toBeTruthy();
    expect(screen.getByTestId('indicator-Banana')).toBeTruthy();
  });

  it('throws outside an item', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        render(
          <Combobox.Root items={['Apple']}>
            <Combobox.ItemIndicator />
          </Combobox.Root>,
        ),
      ).rejects.toThrow(/ComboboxItemContext is missing/);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('Combobox.Status', () => {
  function TestStatus(props: Partial<React.ComponentProps<typeof Combobox.Root>>) {
    return (
      <Combobox.Root items={['Apple', 'Apricot', 'Banana']} {...props}>
        <Combobox.Input testID="input" />
        <Combobox.Status testID="status" />
      </Combobox.Root>
    );
  }

  it('renders nothing while the list is closed', async () => {
    await render(<TestStatus />);

    expect(screen.queryByTestId('status')).toBeNull();
  });

  it('announces the result count as a polite live region', async () => {
    await render(<TestStatus defaultOpen />);

    const status = screen.getByTestId('status');
    expect(status).toHaveTextContent('3 results');
    expect(status.props.accessibilityLiveRegion).toBe('polite');
    expect(status.props.role).toBe('status');
  });

  it('follows the query, down to none and the singular', async () => {
    await render(<TestStatus defaultOpen />);

    await type('ap');
    expect(screen.getByTestId('status')).toHaveTextContent('2 results');

    await type('ban');
    expect(screen.getByTestId('status')).toHaveTextContent('1 result');

    await type('zzz');
    expect(screen.getByTestId('status')).toHaveTextContent('No results');
  });

  it('counts items inside groups, not the groups', async () => {
    await render(<TestStatus items={GROUPED} defaultOpen />);

    expect(screen.getByTestId('status')).toHaveTextContent('5 results');
  });

  it('lets a function child localize the announcement', async () => {
    await render(
      <Combobox.Root items={['Apple', 'Banana']} defaultOpen>
        <Combobox.Status testID="status">
          {(state) => `${state.count} sonuç`}
        </Combobox.Status>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('2 sonuç');
  });
});

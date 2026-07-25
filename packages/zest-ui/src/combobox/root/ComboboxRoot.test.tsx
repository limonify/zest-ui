import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Combobox } from '../../index';

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

    expect(onValueChange).toHaveBeenCalledWith(
      'Banana',
      expect.objectContaining({ reason: 'item-press' }),
    );
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

  it('stays open on an outside press when dismissal is disabled', async () => {
    await render(<TestCombobox defaultOpen disablePointerDismissal />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop', hidden));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('reports why the list opened and closed', async () => {
    const onOpenChange = jest.fn();
    await render(<TestCombobox onOpenChange={onOpenChange} />);

    await focus('input');
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-focus' }),
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop', hidden));
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
  });

  it('lets onOpenChange cancel an open', async () => {
    const onOpenChange = jest.fn((_open: boolean, details: Combobox.Root.ChangeEventDetails) => {
      details.cancel();
    });
    await render(<TestCombobox onOpenChange={onOpenChange} />);

    await focus('input');

    expect(onOpenChange).toHaveBeenCalled();
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('lets onInputValueChange cancel a keystroke', async () => {
    await render(
      <TestCombobox
        defaultOpen
        onInputValueChange={(_value, details) => {
          details.cancel();
        }}
      />,
    );

    await type('input', 'ap');

    expect(screen.getByTestId('input').props.value).toBe('');
    // The canceled keystroke also leaves the list unfiltered.
    expect(screen.getByTestId('item-Banana')).toBeTruthy();
  });

  it('exposes the item index and the popup placement on state', async () => {
    const popupState = jest.fn();
    const indexes: number[] = [];

    await render(
      <Combobox.Root items={FRUITS} defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup
              testID="popup"
              style={(state) => {
                popupState(state);
                return undefined;
              }}
            >
              <Combobox.List>
                {(item) => (
                  <Combobox.Item
                    key={String(item.value)}
                    testID={`item-${item.value}`}
                    item={item}
                    style={(state) => {
                      indexes.push(state.index);
                      return undefined;
                    }}
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

    expect(popupState).toHaveBeenCalledWith(
      expect.objectContaining({ open: true, side: 'bottom', align: 'start' }),
    );
    expect(popupState.mock.calls[0]![0]).toHaveProperty('transitionStatus');
    // Items are indexed in registration order until they report a layout.
    expect(indexes).toContain(0);
  });

  it('opens and closes through a handle from a detached input', async () => {
    const handle = Combobox.createHandle();

    await render(
      <>
        <Combobox.Input testID="input" nativeID="fruit-input" handle={handle} />
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
      handle.open('fruit-input');
    });
    expect(screen.getByTestId('popup')).toBeTruthy();

    await act(async () => {
      handle.close();
    });
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('closes through actionsRef without firing onOpenChange for the unmount', async () => {
    const actionsRef = React.createRef<Combobox.Root.Actions>();
    const onOpenChange = jest.fn();

    await render(
      <TestCombobox defaultOpen actionsRef={actionsRef} onOpenChange={onOpenChange} />,
    );

    await act(async () => {
      actionsRef.current!.unmount();
    });

    expect(screen.queryByTestId('popup')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

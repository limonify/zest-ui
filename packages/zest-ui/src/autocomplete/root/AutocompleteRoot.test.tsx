import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Autocomplete } from '../../index';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Cherry'];

function TestAutocomplete(props: React.ComponentProps<typeof Autocomplete.Root>) {
  return (
    <Autocomplete.Root items={FRUITS} {...props}>
      <Autocomplete.Input testID="input" />
      <Autocomplete.Portal>
        <Autocomplete.Backdrop testID="backdrop" />
        <Autocomplete.Positioner>
          <Autocomplete.Popup testID="popup">
            <Autocomplete.Empty testID="empty">
              <Text>No fruit</Text>
            </Autocomplete.Empty>
            <Autocomplete.List>
              {(item) => (
                <Autocomplete.Item
                  key={String(item.value)}
                  testID={`item-${item.value}`}
                  item={item}
                >
                  <Text>{item.label}</Text>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
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

describe('Autocomplete', () => {
  it('renders the input closed', async () => {
    await render(<TestAutocomplete />);

    expect(screen.getByTestId('input')).toBeTruthy();
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('is free text: choosing a suggestion fills the input without a separate value', async () => {
    const onInputValueChange = jest.fn();
    await render(<TestAutocomplete defaultOpen onInputValueChange={onInputValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Cherry'));

    expect(onInputValueChange).toHaveBeenLastCalledWith(
      'Cherry',
      expect.objectContaining({ reason: 'item-press' }),
    );
    expect(screen.getByTestId('input').props.value).toBe('Cherry');
  });

  it('takes its text from defaultInputValue when uncontrolled', async () => {
    await render(<TestAutocomplete defaultInputValue="Ban" />);
    expect(screen.getByTestId('input').props.value).toBe('Ban');
  });

  it('takes its text from inputValue when controlled', async () => {
    await render(<TestAutocomplete inputValue="Cher" />);
    expect(screen.getByTestId('input').props.value).toBe('Cher');

    await type('input', 'Straw');
    // A controlled input only changes when the consumer says so.
    expect(screen.getByTestId('input').props.value).toBe('Cher');
  });

  it('filters the suggestions by the typed query', async () => {
    await render(<TestAutocomplete defaultOpen />);

    await type('input', 'ap');

    expect(screen.getByTestId('item-Apple')).toBeTruthy();
    expect(screen.getByTestId('item-Apricot')).toBeTruthy();
    expect(screen.queryByTestId('item-Banana')).toBeNull();
  });

  it('matches ignoring case and accents', async () => {
    await render(
      <Autocomplete.Root items={['Résumé', 'Report']} defaultOpen>
        <Autocomplete.Input testID="input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup>
              <Autocomplete.List>
                {(item) => (
                  <Autocomplete.Item
                    key={String(item.value)}
                    testID={`item-${item.value}`}
                    item={item}
                  >
                    <Text>{item.label}</Text>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    await type('input', 'resume');

    expect(screen.getByTestId('item-Résumé')).toBeTruthy();
    expect(screen.queryByTestId('item-Report')).toBeNull();
  });

  it('shows the empty state when nothing matches', async () => {
    await render(<TestAutocomplete defaultOpen />);

    await type('input', 'zzz');

    expect(screen.getByTestId('empty', hidden)).toBeTruthy();
  });

  it('reports why the list opened', async () => {
    const onOpenChange = jest.fn();
    await render(<TestAutocomplete onOpenChange={onOpenChange} />);

    await focus('input');

    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-focus' }),
    );
  });

  it('lets onOpenChange cancel an open', async () => {
    await render(
      <TestAutocomplete
        onOpenChange={(_open, details) => {
          details.cancel();
        }}
      />,
    );

    await focus('input');

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('ignores interaction when disabled', async () => {
    await render(<TestAutocomplete disabled />);

    expect(screen.getByTestId('input').props.editable).toBe(false);
    expect(screen.getByTestId('input').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('announces itself as a collapsed search field', async () => {
    await render(<TestAutocomplete />);

    const input = screen.getByTestId('input');
    expect(input.props.accessibilityRole).toBe('search');
    expect(input.props['aria-autocomplete']).toBe('list');
    expect(input.props.accessibilityState).toMatchObject({ expanded: false });

    await focus('input');
    expect(screen.getByTestId('input').props.accessibilityState).toMatchObject({ expanded: true });
  });

  it('opens and closes through a handle', async () => {
    const handle = Autocomplete.createHandle();

    await render(
      <>
        <Autocomplete.Input testID="input" nativeID="fruit-input" handle={handle} />
        <Autocomplete.Root items={FRUITS} handle={handle}>
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup testID="popup" />
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </>,
    );

    await act(async () => {
      handle.open('fruit-input');
    });
    expect(screen.getByTestId('popup')).toBeTruthy();

    await act(async () => {
      handle.close();
    });
    expect(screen.queryByTestId('popup')).toBeNull();
  });
});

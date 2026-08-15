import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Combobox } from '../../index';

const FRUITS = ['Apple', 'Banana', 'Cherry'];

function TestCombobox(props: Partial<React.ComponentProps<typeof Combobox.Root>>) {
  return (
    <Combobox.Root items={FRUITS} {...props}>
      <Combobox.Trigger testID="trigger">
        <Combobox.Value testID="value" />
        <Combobox.Icon testID="icon">
          <Text>▾</Text>
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Backdrop testID="backdrop" />
        <Combobox.Positioner>
          <Combobox.Popup testID="popup">
            <Combobox.Input testID="input" />
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

const hidden = { includeHiddenElements: true } as const;

describe('Combobox.Icon', () => {
  it('renders inside the trigger', async () => {
    await render(<TestCombobox />);

    expect(screen.getByTestId('icon', hidden)).toBeTruthy();
  });

  it('publishes open on its state', async () => {
    let iconState: Combobox.Icon.State | undefined;

    await render(
      <Combobox.Root items={FRUITS}>
        <Combobox.Trigger testID="trigger">
          <Combobox.Icon testID="icon" style={(state) => {
            iconState = state;
            return undefined;
          }} />
        </Combobox.Trigger>
      </Combobox.Root>,
    );

    expect(iconState?.open).toBe(false);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(iconState?.open).toBe(true);
  });

  it('is hidden from assistive technology', async () => {
    await render(<TestCombobox />);

    expect(screen.getByTestId('icon', hidden).props.accessibilityElementsHidden).toBe(true);
  });
});

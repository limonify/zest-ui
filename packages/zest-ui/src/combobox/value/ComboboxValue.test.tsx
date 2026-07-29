import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Combobox } from '../index';

function TestCombobox(props: React.ComponentProps<typeof Combobox.Root>) {
  return (
    <Combobox.Root {...props}>
      <Combobox.Value testID="value" />
      <Combobox.Input testID="input" />
    </Combobox.Root>
  );
}

describe('Combobox.Value', () => {
  it('renders the current input text', async () => {
    await render(<TestCombobox defaultInputValue="apple" />);

    expect(screen.getByTestId('value')).toHaveTextContent('apple');
  });

  it('follows the input as it is typed into', async () => {
    const user = userEvent.setup();
    await render(<TestCombobox />);

    await user.type(screen.getByTestId('input'), 'pear');

    expect(screen.getByTestId('value')).toHaveTextContent('pear');
  });

  it('lets children override the displayed text', async () => {
    await render(
      <Combobox.Root defaultInputValue="apple">
        <Combobox.Value testID="value">
          <Text>Custom</Text>
        </Combobox.Value>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('value')).toHaveTextContent('Custom');
    expect(screen.queryByText('apple')).toBeNull();
  });

  it('exposes the value on the state passed to style and render', async () => {
    const styleFn = jest.fn(() => ({}));

    await render(
      <Combobox.Root defaultInputValue="apple">
        <Combobox.Value testID="value" style={styleFn} />
      </Combobox.Root>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'apple' }));
  });

  it('can be replaced through the render prop', async () => {
    await render(
      <Combobox.Root defaultInputValue="apple">
        <Combobox.Value
          render={(props, state) => <Text {...props} testID="custom" children={`> ${state.value}`} />}
        />
      </Combobox.Root>,
    );

    expect(screen.getByTestId('custom')).toHaveTextContent('> apple');
  });
});
